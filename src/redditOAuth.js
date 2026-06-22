import crypto from 'node:crypto';

const REDDIT_AUTHORIZE_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_ME_URL = 'https://oauth.reddit.com/api/v1/me';

export const REDDIT_SCOPES = 'identity history read';

export function requireRedditConfig() {
  const missing = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing Reddit OAuth configuration: ${missing.join(', ')}`);
    error.status = 500;
    throw error;
  }
}

export function makeOAuthState() {
  return crypto.randomBytes(24).toString('hex');
}

export function redditCallbackUrl() {
  return process.env.REDDIT_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:3000'}/source-auth/reddit/callback`;
}

export function buildRedditAuthorizeUrl(state) {
  requireRedditConfig();
  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID,
    response_type: 'code',
    state,
    redirect_uri: redditCallbackUrl(),
    duration: 'permanent',
    scope: REDDIT_SCOPES
  });
  return `${REDDIT_AUTHORIZE_URL}?${params.toString()}`;
}

function redditAuthHeader() {
  const raw = `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(raw).toString('base64')}`;
}

function redditHeaders(extra = {}) {
  return {
    'User-Agent': process.env.REDDIT_USER_AGENT || 'one-click-personality-review/1.0',
    ...extra
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(`Reddit API request failed (${response.status}): ${text.slice(0, 500)}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function exchangeRedditCode(code) {
  requireRedditConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redditCallbackUrl()
  });
  return fetchJson(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: redditHeaders({
      Authorization: redditAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    body
  });
}

export async function refreshRedditToken(refreshToken) {
  requireRedditConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });
  return fetchJson(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: redditHeaders({
      Authorization: redditAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
    body
  });
}

export async function fetchRedditIdentity(accessToken) {
  const me = await fetchJson(REDDIT_ME_URL, {
    headers: redditHeaders({
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    })
  });

  return {
    provider: 'reddit',
    providerUserId: me.id || me.name,
    username: me.name,
    displayName: me.subreddit?.display_name_prefixed || me.name,
    raw: {
      id: me.id,
      name: me.name,
      created_utc: me.created_utc,
      subreddit_url: me.subreddit?.url || null
    }
  };
}
