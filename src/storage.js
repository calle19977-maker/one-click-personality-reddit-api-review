// Minimal in-memory storage for review/demo purposes.
// Production should store tokens encrypted server-side and provide a user-facing disconnect/delete flow.

const accounts = new Map();

export function saveRedditAccount({ identity, tokens }) {
  const id = `reddit:${identity.providerUserId}`;
  const now = new Date().toISOString();
  const account = {
    id,
    provider: 'reddit',
    providerUserId: identity.providerUserId,
    username: identity.username,
    displayName: identity.displayName,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || '',
    scope: tokens.scope || '',
    expiresAt: tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : null,
    createdAt: accounts.get(id)?.createdAt || now,
    updatedAt: now
  };
  accounts.set(id, account);
  return publicAccount(account);
}

export function listAccounts() {
  return [...accounts.values()].map(publicAccount);
}

export function getAccount(id) {
  return accounts.get(id) || null;
}

export function deleteAccount(id) {
  return accounts.delete(id);
}

export function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    provider: account.provider,
    providerUserId: account.providerUserId,
    username: account.username,
    displayName: account.displayName,
    scope: account.scope,
    expiresAt: account.expiresAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}
