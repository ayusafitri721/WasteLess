import { env } from '../../config/env.js';
import { getOAuthProvider } from './oauth.config.js';
import {
  buildAuthorizationUrl,
  exchangeOAuthCode,
  handleOAuthCallback,
  oauthRedirectCode,
} from './oauth.service.js';

function redirectToLogin(res, code) {
  const target = new URL(`${env.CLIENT_ORIGIN.replace(/\/$/, '')}/masuk`);
  target.searchParams.set('s', code);
  res.redirect(302, target.toString());
}

export function start(req, res) {
  const provider = getOAuthProvider(req.validated.params.provider);
  const url = buildAuthorizationUrl(provider, req.validated.query.role);
  res.redirect(302, url);
}

export async function callback(req, res) {
  const { error } = req.validated.query;
  if (error === 'access_denied') {
    return redirectToLogin(res, 'oauth_cancelled');
  }

  try {
    const provider = getOAuthProvider(req.validated.params.provider);
    const target = await handleOAuthCallback(provider, req.validated.query);
    return res.redirect(302, target);
  } catch (err) {
    console.error('[oauth] callback gagal:', err.message);
    return redirectToLogin(res, oauthRedirectCode(err));
  }
}

export async function exchange(req, res) {
  const result = await exchangeOAuthCode(req.validated.body.code);
  return res.json({ success: true, data: result });
}
