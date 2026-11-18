import * as usersService from './users.service.js';

export function me(req, res) {
  res.json({
    success: true,
    data: { user: req.user },
  });
}

export async function updateMe(req, res) {
  const user = await usersService.updateProfile(
    req.user.id,
    req.validated.body,
  );

  res.json({
    success: true,
    data: { user },
  });
}
