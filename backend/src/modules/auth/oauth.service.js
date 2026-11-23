import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { OAuthExchange } from './oauth-exchange.model.js';
import { User } from '../users/user.model.js';
import { signAccessToken } from './auth.service.js';
import { assertOAuthConfigured } from './oauth.config.js';
import { createOAuthState, verifyOAuthState } from './oauth.state.js';

const BCRYPT_ROUNDS = 12;
const REQUEST_TIMEOUT_MS = 10000;

const OAUTH_ERROR_CODES = new Set([
  'OAUTH_INVALID_STATE',
  'OAUTH_INVALID_CODE',
  'OAUTH_MISSING_CODE',
  'OAUTH_EMAIL_UNVERIFIED',
  'OAUTH_NOT_CONFIGURED',
  'OAUTH_PROVIDER_UNAVAILABLE',
  'OAUTH_TOKEN_EXCHANGE_FAILED',
  'OAUTH_PROFILE_UNAVAILABLE',
]);

export const OAUTH_ERROR_REDIRECTS = {
  OAUTH_INVALID_STATE: 'oauth_failed',
  OAUTH_INVALID_CODE: 'oauth_failed',
  OAUTH_MISSING_CODE: 'oauth_failed',
  OAUTH_EMAIL_UNVERIFIED: 'oauth_unverified',
  OAUTH_NOT_CONFIGURED: 'oauth_not_configured',
  OAUTH_PROVIDER_UNAVAILABLE: 'oauth_failed',
  OAUTH_TOKEN_EXCHANGE_FAILED: 'oauth_failed',
  OAUTH_PROFILE_UNAVAILABLE: 'oauth_failed',
};

export function oauthRedirectCode(error) {
  if (error instanceof ApiError && OAUTH_ERROR_CODES.has(error.code)) {
    return OAUTH_ERROR_REDIRECTS[error.code];
  }
  return 'oauth_failed';
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function requestJson(url, init, failureCode, failureMessage) {
  let response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(502, failureCode, failureMessage);
  }

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    console.error(
      `[oauth] ${failureCode} dari ${new URL(url).host}: ${response.status}`,
      text.slice(0, 300),
    );
    throw new ApiError(502, failureCode, failureMessage);
  }

  return body;
}

export function buildAuthorizationUrl(provider, role) {
  assertOAuthConfigured(provider);

  const state = createOAuthState({ provider: provider.id, role });
  const url = new URL(provider.authorizationUrl);
  url.searchParams.set('client_id', provider.clientId);
  url.searchParams.set('redirect_uri', provider.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', provider.scope);
  url.searchParams.set('state', state);

  if (provider.id === 'google') {
    url.searchParams.set('prompt', 'select_account');
  } else {
    url.searchParams.set('allow_signup', 'true');
  }

  return url.toString();
}

async function fetchGoogleProfile(provider, code) {
  const token = await requestJson(
    provider.tokenUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        redirect_uri: provider.redirectUri,
        grant_type: 'authorization_code',
      }),
    },
    'OAUTH_TOKEN_EXCHANGE_FAILED',
    'Gagal menukar kode otorisasi dengan Google',
  );

  if (!token.access_token) {
    throw new ApiError(
      502,
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      'Google tidak mengembalikan access token',
    );
  }

  const profile = await requestJson(
    provider.profileUrl,
    { headers: { Authorization: `Bearer ${token.access_token}` } },
    'OAUTH_PROFILE_UNAVAILABLE',
    'Gagal membaca profil Google',
  );

  if (!profile.email || profile.email_verified !== true) {
    throw new ApiError(
      400,
      'OAUTH_EMAIL_UNVERIFIED',
      'Email Google belum terverifikasi',
    );
  }

  return {
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email.split('@')[0],
    providerAccountId: String(profile.sub),
  };
}

async function fetchGitHubProfile(provider, code) {
  const token = await requestJson(
    provider.tokenUrl,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        redirect_uri: provider.redirectUri,
      }),
    },
    'OAUTH_TOKEN_EXCHANGE_FAILED',
    'Gagal menukar kode otorisasi dengan GitHub',
  );

  if (!token.access_token) {
    throw new ApiError(
      502,
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      'GitHub tidak mengembalikan access token',
    );
  }

  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'WasteLess',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const profile = await requestJson(
    provider.profileUrl,
    { headers },
    'OAUTH_PROFILE_UNAVAILABLE',
    'Gagal membaca profil GitHub',
  );
  const emails = await requestJson(
    provider.emailUrl,
    { headers },
    'OAUTH_PROFILE_UNAVAILABLE',
    'Gagal membaca email GitHub',
  );

  const primary =
    emails.find((item) => item.primary && item.verified) ??
    emails.find((item) => item.verified);

  if (!primary?.email) {
    throw new ApiError(
      400,
      'OAUTH_EMAIL_UNVERIFIED',
      'Tidak ada email GitHub yang terverifikasi',
    );
  }

  return {
    email: primary.email.toLowerCase(),
    name: profile.name || profile.login || primary.email.split('@')[0],
    providerAccountId: String(profile.id),
  };
}

async function resolveUser({ provider, profile, role }) {
  const existing = await User.findOne({ email: profile.email });

  if (existing) {
    const linked = existing.oauthAccounts?.some(
      (account) =>
        account.provider === provider.id &&
        account.providerAccountId === profile.providerAccountId,
    );

    if (!linked) {
      existing.oauthAccounts = [
        ...(existing.oauthAccounts ?? []),
        {
          provider: provider.id,
          providerAccountId: profile.providerAccountId,
        },
      ];
      await existing.save();
    }

    return existing;
  }

  const passwordHash = await bcrypt.hash(
    crypto.randomBytes(32).toString('hex'),
    BCRYPT_ROUNDS,
  );

  try {
    return await User.create({
      name: profile.name,
      email: profile.email,
      passwordHash,
      role,
      verificationStatus: 'unverified',
      oauthAccounts: [
        {
          provider: provider.id,
          providerAccountId: profile.providerAccountId,
        },
      ],
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return User.findOne({ email: profile.email });
  }
}

export async function handleOAuthCallback(provider, query) {
  assertOAuthConfigured(provider);

  if (!query.code) {
    throw new ApiError(400, 'OAUTH_MISSING_CODE', 'Kode otorisasi tidak ada');
  }

  const state = verifyOAuthState(query.state, provider.id);
  const profile =
    provider.id === 'google'
      ? await fetchGoogleProfile(provider, query.code)
      : await fetchGitHubProfile(provider, query.code);

  const user = await resolveUser({
    provider,
    profile,
    role: state.role,
  });

  const code = crypto.randomBytes(32).toString('base64url');
  await OAuthExchange.create({
    codeHash: hashCode(code),
    userId: user._id,
    expiresAt: new Date(
      Date.now() + env.OAUTH_EXCHANGE_TTL_SECONDS * 1000,
    ),
  });

  const callback = new URL(
    `${env.CLIENT_ORIGIN.replace(/\/$/, '')}/api/auth/oauth/callback`,
  );
  callback.searchParams.set('code', code);
  return callback.toString();
}

export async function exchangeOAuthCode(code) {
  if (typeof code !== 'string' || code.length < 20) {
    throw new ApiError(400, 'OAUTH_INVALID_CODE', 'Kode pertukaran tidak valid');
  }

  const record = await OAuthExchange.findOneAndUpdate(
    {
      codeHash: hashCode(code),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!record) {
    throw new ApiError(400, 'OAUTH_INVALID_CODE', 'Kode pertukaran tidak valid');
  }

  const user = await User.findById(record.userId).select('+tokenVersion');
  if (!user) {
    throw new ApiError(400, 'OAUTH_INVALID_CODE', 'Akun tidak ditemukan');
  }

  user.passwordHash = undefined;

  return {
    user,
    token: signAccessToken(user),
  };
}
