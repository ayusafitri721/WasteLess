import * as authService from './auth.service.js';
import { isEmailConfigured } from '../../utils/mailer.js';

export async function register(req, res) {
  const user = await authService.register(req.validated.body);

  res.status(201).json({
    success: true,
    data: { user },
  });
}

export async function login(req, res) {
  const { user, token } = await authService.login(req.validated.body);

  res.json({
    success: true,
    data: { user, token },
  });
}

export async function requestReset(req, res) {
  const { token, expiresAt } = await authService.requestPasswordReset(
    req.validated.body.email,
  );

  const data = {
    message: isEmailConfigured()
      ? 'Jika email terdaftar, tautan reset sudah dikirim ke email Anda.'
      : 'Jika email terdaftar, tautan reset sudah dibuat dan berlaku 15 menit.',
  };
  if (token) {
    data.resetToken = token;
    data.expiresAt = expiresAt;
  }

  res.json({ success: true, data });
}

export async function resetPassword(req, res) {
  const user = await authService.resetPassword(req.validated.body);

  res.json({
    success: true,
    data: { user },
  });
}

export async function logout(req, res) {
  await authService.logout(req.user.id);
  res.status(204).send();
}

export function me(req, res) {
  res.json({
    success: true,
    data: { user: req.user },
  });
}
