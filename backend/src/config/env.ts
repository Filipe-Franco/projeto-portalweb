import 'dotenv/config';

export type AppEnv = 'development' | 'test' | 'staging' | 'production';

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: (process.env.NODE_ENV || 'development') as AppEnv,
  port: readNumber(process.env.PORT, 3000),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://portal_user:portal_pass@localhost:5433/portalweb',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtAdminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h',
  uploadDir: process.env.UPLOAD_DIR || '/workspace/uploads',
  maxUploadMb: readNumber(process.env.MAX_UPLOAD_MB, 10),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: readNumber(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
  smtpSecure: ['true', '1', 'sim'].includes(String(process.env.SMTP_SECURE || '').toLowerCase()),
  emailQueueIntervalMs: readNumber(process.env.EMAIL_QUEUE_INTERVAL_MS, 60000),
  emailQueueBatchSize: readNumber(process.env.EMAIL_QUEUE_BATCH_SIZE, 10),
  emailQueueMaxAttempts: readNumber(process.env.EMAIL_QUEUE_MAX_ATTEMPTS, 3),
  emailQueueSendDelayMs: readNumber(process.env.EMAIL_QUEUE_SEND_DELAY_MS, 1500),
} as const;

export const isProduction = env.nodeEnv === 'production';

if (isProduction) {
  const missingOrUnsafe: string[] = [];

  if (!process.env.DATABASE_URL) missingOrUnsafe.push('DATABASE_URL');
  if (!process.env.CORS_ORIGIN) missingOrUnsafe.push('CORS_ORIGIN');
  if (!process.env.PUBLIC_SITE_URL) missingOrUnsafe.push('PUBLIC_SITE_URL');
  if (!process.env.JWT_SECRET || env.jwtSecret === 'change_me' || env.jwtSecret.length < 32) {
    missingOrUnsafe.push('JWT_SECRET');
  }

  if (missingOrUnsafe.length) {
    throw new Error(
      'Configuração insegura em produção. Ajuste: ' + missingOrUnsafe.join(', '),
    );
  }
}
