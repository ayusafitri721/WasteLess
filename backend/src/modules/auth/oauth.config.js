import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

const backendOrigin = env.OAUTH_BACKEND_ORIGIN.replace(/\/$/, '');

const providers = {
  google: {
    id: 'google',
    label: 'Google',
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    redirectUri: `${backendOrigin}/api/auth/oauth/google/callback`,
  },
  github: {
    id: 'github',
    label: 'GitHub',
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    profileUrl: 'https://api.github.com/user',
    emailUrl: 'https://api.github.com/user/emails',
    scope: 'user:email',
    redirectUri: `${backendOrigin}/api/auth/oauth/github/callback`,
  },
};

export function getOAuthProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw new ApiError(
      404,
      'OAUTH_PROVIDER_NOT_FOUND',
      `Provider OAuth ${name} tidak dikenal`,
    );
  }
  return provider;
}

export function assertOAuthConfigured(provider) {
  if (!provider.clientId || !provider.clientSecret) {
    throw new ApiError(
      503,
      'OAUTH_NOT_CONFIGURED',
      `Login dengan ${provider.label} belum dikonfigurasi`,
    );
  }
}
