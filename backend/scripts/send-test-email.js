import { env } from '../src/config/env.js';
import { sendTestEmail } from '../src/utils/mailer.js';

const recipient = process.env.TEST_EMAIL_TO?.trim() || env.SMTP_USER;

if (!recipient) {
  console.error('Isi TEST_EMAIL_TO atau SMTP_USER di environment.');
  process.exit(1);
}

try {
  await sendTestEmail(recipient);
  console.log(`Email tes berhasil dikirim ke ${recipient}`);
} catch (error) {
  console.error('Gagal mengirim email tes:', error.message);
  process.exitCode = 1;
}
