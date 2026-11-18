import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../modules/users/user.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(
      401,
      'UNAUTHENTICATED',
      'Token autentikasi tidak diberikan',
    );
  }

  const token = header.slice('Bearer '.length).trim();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'wasteless',
    });
  } catch {
    throw new ApiError(
      401,
      'INVALID_TOKEN',
      'Token tidak valid atau sudah kedaluwarsa',
    );
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Token tidak valid');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) {
    throw new ApiError(
      401,
      'INVALID_TOKEN',
      'Akun untuk token ini tidak ditemukan',
    );
  }

  if ((payload.tv ?? 0) !== user.tokenVersion) {
    throw new ApiError(
      401,
      'TOKEN_REVOKED',
      'Sesi sudah berakhir, silakan login kembali',
    );
  }

  user.tokenVersion = undefined;
  req.user = user;
  next();
}
