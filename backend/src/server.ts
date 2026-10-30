import { createApp } from './app.js';
import { assertDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';
import { startEmailQueueWorker, stopEmailQueueWorker } from './modules/email/email.worker.js';

async function bootstrap(): Promise<void> {
  await assertDatabaseConnection();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`[server] portalweb-api listening on port ${env.port}`);
    startEmailQueueWorker();
  });
}

bootstrap().catch((error: unknown) => {
  console.error('[server] failed to start');
  console.error(error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopEmailQueueWorker();
  process.exit(0);
});

process.on('SIGINT', () => {
  stopEmailQueueWorker();
  process.exit(0);
});
