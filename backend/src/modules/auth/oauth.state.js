import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

function sign(payload) {
  return crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(payload)
    .digest('base64url');
}

export function createOAuthState({
  provider,
  role,
  ttlSeconds = env.OAUTH_STATE_TTL_SECONDS,
}) {
  const payload = Buffer.from(
    JSON.stringify({
      provider,
      role,
      nonce: crypto.randomBytes(16).toString('hex'),
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function verifyOAuthState(state, provider) {
  const invalid = () =>
    new ApiError(400, 'OAUTH_INVALID_STATE', 'State OAuth tidak valid');

  if (typeof state !== 'string') throw invalid();

  const [payload, signature, extra] = state.split('.');
  if (!payload || !signature || extra) throw invalid();

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    throw invalid();
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw invalid();
  }

  if (
    !data ||
    data.provider !== provider ||
    !['provider', 'receiver'].includes(data.role) ||
    typeof data.exp !== 'number' ||
    data.exp < Math.floor(Date.now() / 1000)
  ) {
    throw invalid();
  }

  return data;
}
