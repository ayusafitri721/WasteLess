import app from './app.js';
import {
  connectDatabase,
  disconnectDatabase,
} from './config/database.js';
import { env } from './config/env.js';
import { startExpirationJob } from './jobs/expiration.job.js';

let server;

async function start() {
  await connectDatabase();
  startExpirationJob({ intervalMs: env.EXPIRATION_JOB_INTERVAL_MS });

  server = app.listen(env.PORT, () => {
    console.log(
      `WasteLess API berjalan pada port ${env.PORT} (${env.NODE_ENV})`,
    );
  });
}

async function shutdown(signal) {
  console.log(`Sinyal ${signal} diterima, menutup server...`);

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  await disconnectDatabase();
  process.exit(0);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown(signal).catch((err) => {
      console.error('Gagal menutup server:', err.message);
      process.exit(1);
    });
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

start().catch((err) => {
  console.error('Gagal menjalankan server:', err.message);
  process.exit(1);
});
