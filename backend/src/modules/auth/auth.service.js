import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { isEmailConfigured, sendPasswordResetEmail } from '../../utils/mailer.js';
import { User } from '../users/user.model.js';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) {
    return { token: null, expiresAt: null };
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetTokenHash: hashResetToken(token),
        passwordResetExpiresAt: expiresAt,
      },
    },
  );

  if (isEmailConfigured()) {
    try {
      await sendPasswordResetEmail({ to: email, token, expiresAt });
    } catch (error) {
      console.error('[mail] gagal mengirim email reset:', error.message);
      throw new ApiError(
        502,
        'EMAIL_SEND_FAILED',
        'Email reset gagal dikirim. Periksa konfigurasi SMTP atau coba lagi nanti.',
      );
    }
  }

  return {
    token:
      env.NODE_ENV === 'production' || isEmailConfigured() ? null : token,
    expiresAt,
  };
}

export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(
      400,
      'INVALID_RESET_TOKEN',
      'Tautan reset tidak valid atau sudah kedaluwarsa',
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash },
      $inc: { tokenVersion: 1 },
      $unset: {
        passwordResetTokenHash: '',
        passwordResetExpiresAt: '',
      },
    },
  );

  const updated = await User.findById(user._id).select('+tokenVersion');
  updated.passwordHash = undefined;

  return updated;
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
