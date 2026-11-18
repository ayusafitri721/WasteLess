import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../users/user.model.js';

const BCRYPT_ROUNDS = 12;

export async function register(input) {
  const existing = await User.exists({ email: input.email });
  if (existing) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    return await User.create({ ...input, passwordHash });
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
    }
    throw err;
  }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select(
    '+passwordHash +tokenVersion',
  );

  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Email atau password salah',
    );
  }

  user.passwordHash = undefined;

  return {
    user,
    token: signAccessToken(user),
  };
}

export async function logout(userId) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: 'wasteless',
    },
  );
}
