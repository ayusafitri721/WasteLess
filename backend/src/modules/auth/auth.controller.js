import * as authService from './auth.service.js';

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
