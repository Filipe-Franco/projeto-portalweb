import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { isSmtpConfigured, processEmailQueue } from './email.service.js';

let timer: NodeJS.Timeout | null = null;
let isRunning = false;

async function runOnce() {
  if (isRunning) return;
  isRunning = true;
  try {
    await processEmailQueue();
  } catch (error) {
    logger.error('[email] erro inesperado ao processar fila', { error });
  } finally {
    isRunning = false;
  }
}

export function startEmailQueueWorker() {
  if (timer) return;

  if (!isSmtpConfigured()) {
    logger.warn('[email] SMTP não configurado; worker de e-mail não iniciado.');
    return;
  }

  void runOnce();
  timer = setInterval(() => void runOnce(), env.emailQueueIntervalMs);
  logger.info('[email] worker de e-mail iniciado', { intervalMs: env.emailQueueIntervalMs, batchSize: env.emailQueueBatchSize });
}

export function stopEmailQueueWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  logger.info('[email] worker de e-mail encerrado');
}
