import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

const transporter = isEmailConfigured()
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

function fromAddress() {
  return env.MAIL_FROM || `"WasteLess" <${env.SMTP_USER}>`;
}

export function resetPasswordLink(token) {
  const base = env.CLIENT_ORIGIN.replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail({ to, token, expiresAt }) {
  if (!transporter) {
    throw new Error('SMTP belum dikonfigurasi');
  }

  const link = resetPasswordLink(token);
  const minutes = Math.max(
    1,
    Math.round((expiresAt.getTime() - Date.now()) / 60000),
  );

  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject: 'Atur ulang password WasteLess',
    text: [
      'WASTELESS - ATUR ULANG PASSWORD',
      '',
      'Kami menerima permintaan untuk mengganti password akun WasteLess Anda.',
      `Buka tautan ini untuk membuat password baru: ${link}`,
      '',
      `Tautan berlaku ${minutes} menit dan hanya bisa dipakai sekali.`,
      'Jika Anda tidak meminta penggantian password, abaikan email ini.',
      'Password Anda tidak berubah sampai tautan tersebut dipakai.',
      '',
      'WasteLess - Kurangi food waste, berbagi kebaikan.',
    ].join('\n'),
    html: `
      <div style="margin:0;padding:32px 12px;background:#f4f7f3;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:collapse;">
          <tr>
            <td style="padding:28px 32px;border:1px solid #dee7e0;border-radius:16px;background:#ffffff;">
              <p style="margin:0 0 8px;color:#0b7a43;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Keamanan akun</p>
              <h1 style="margin:0 0 12px;color:#16261d;font-size:24px;line-height:1.3;">Atur ulang password</h1>
              <p style="margin:0 0 22px;color:#5b6b61;font-size:15px;line-height:1.6;">
                Kami menerima permintaan untuk mengganti password akun WasteLess Anda. Gunakan tombol di bawah untuk membuat password baru.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="border-radius:10px;background:#0b7a43;">
                    <a href="${link}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">Ganti password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 6px;color:#5b6b61;font-size:13px;line-height:1.6;">
                Jika tombol tidak berfungsi, salin tautan ini ke browser:
              </p>
              <p style="margin:0;word-break:break-all;">
                <a href="${link}" style="color:#0b7a43;font-size:13px;">${link}</a>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-collapse:collapse;">
                <tr>
                  <td style="border-radius:10px;background:#e6f3ea;padding:12px 14px;color:#086336;font-size:13px;line-height:1.6;">
                    Tautan berlaku ${minutes} menit dan hanya bisa dipakai sekali.
                  </td>
                </tr>
              </table>
              <hr style="margin:24px 0;border:0;border-top:1px solid #dee7e0;" />
              <p style="margin:0;color:#5b6b61;font-size:12px;line-height:1.6;">
                Jika Anda tidak meminta penggantian password, abaikan email ini. Password Anda tidak berubah.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;color:#5b6b61;font-size:12px;text-align:center;">
              WasteLess - Kurangi food waste, berbagi kebaikan.
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

export async function sendTestEmail(to) {
  if (!transporter) {
    throw new Error(
      'SMTP belum dikonfigurasi. Isi SMTP_HOST, SMTP_USER, dan SMTP_PASS di .env.',
    );
  }

  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject: 'Tes pengiriman email WasteLess',
    text: 'Jika Anda menerima email ini, konfigurasi SMTP sudah benar.',
    html: '<p>Jika Anda menerima email ini, konfigurasi SMTP sudah benar.</p>',
  });
}
