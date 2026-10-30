import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { listPendingEmails, markEmailFailed, markEmailSent, type PendingEmailRow } from './email.repository.js';

let transporter: Transporter | null = null;

export function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpFrom);
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser || env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });
  }
  return transporter;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Falha desconhecida ao enviar e-mail.';
}

async function sendEmail(email: PendingEmailRow) {
  const smtp = getTransporter();
  if (!smtp) {
    throw new Error('SMTP não configurado. Defina SMTP_HOST e SMTP_FROM.');
  }

  await smtp.sendMail({
    from: env.smtpFrom,
    to: email.destinatario,
    subject: email.assunto,
    text: email.corpo,
  });
}

export async function processEmailQueue() {
  if (!isSmtpConfigured()) {
    logger.debug('[email] SMTP não configurado; fila não processada.');
    return { processed: 0, sent: 0, failed: 0, skipped: true };
  }

  const pending = await listPendingEmails(env.emailQueueBatchSize, env.emailQueueMaxAttempts);
  let sent = 0;
  let failed = 0;

  for (const [index, email] of pending.entries()) {
    if (index > 0 && env.emailQueueSendDelayMs > 0) {
      await delay(env.emailQueueSendDelayMs);
    }
    try {
      await sendEmail(email);
      await markEmailSent(email.id);
      sent += 1;
      logger.info('[email] e-mail enviado', { emailId: email.id, to: email.destinatario });
    } catch (error) {
      failed += 1;
      const message = errorMessage(error);
      await markEmailFailed(email.id, message, env.emailQueueMaxAttempts);
      logger.error('[email] falha ao enviar e-mail', { emailId: email.id, to: email.destinatario, error: message });
    }
  }

  return { processed: pending.length, sent, failed, skipped: false };
}
