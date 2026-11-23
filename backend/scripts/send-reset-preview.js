import { env } from '../src/config/env.js';
import { sendPasswordResetEmail } from '../src/utils/mailer.js';

const recipient = process.env.TEST_EMAIL_TO?.trim() || env.SMTP_USER;

if (!recipient) {
  console.error('Isi TEST_EMAIL_TO atau SMTP_USER di environment.');
  process.exit(1);
}

const token = 'preview-token-1234567890abcdef';
const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

try {
  await sendPasswordResetEmail({ to: recipient, token, expiresAt });
  console.log(`Preview email reset berhasil dikirim ke ${recipient}`);
} catch (error) {
  console.error('Gagal mengirim preview email reset:', error.message);
  process.exitCode = 1;
}
