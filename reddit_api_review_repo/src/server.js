import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import {
  buildRedditAuthorizeUrl,
  exchangeRedditCode,
  fetchRedditIdentity,
  makeOAuthState,
  refreshRedditToken
} from './redditOAuth.js';
import { deleteAccount, getAccount, listAccounts, saveRedditAccount } from './storage.js';
import { fetchRedditUserPosts } from './redditPosts.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const cookieSecret = process.env.COOKIE_SECRET || 'local-review-only-cookie-secret';

app.use(express.json());
app.use(cookieParser(cookieSecret));
app.use(express.static('public'));

function errorResponse(res, error) {
  const status = Number(error.status || 500);
  res.status(status).json({ error: error.message || 'Unexpected error' });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, redditConfigured: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) });
});

app.get('/source-auth/reddit/start', (req, res) => {
  try {
    const state = makeOAuthState();
    res.cookie('reddit_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      signed: true,
      maxAge: 10 * 60 * 1000
    });
    res.redirect(buildRedditAuthorizeUrl(state));
  } catch (error) {
    errorResponse(res, error);
  }
});

app.get('/source-auth/reddit/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) throw Object.assign(new Error(`Reddit authorization failed: ${error}`), { status: 400 });
    if (!code || !state) throw Object.assign(new Error('Missing Reddit OAuth code or state.'), { status: 400 });
    if (state !== req.signedCookies.reddit_oauth_state) throw Object.assign(new Error('Invalid OAuth state.'), { status: 400 });

    res.clearCookie('reddit_oauth_state');
    const tokens = await exchangeRedditCode(String(code));
    const identity = await fetchRedditIdentity(tokens.access_token);
    const account = saveRedditAccount({ identity, tokens });

    res.redirect(`/?connected=${encodeURIComponent(account.id)}`);
  } catch (error) {
    errorResponse(res, error);
  }
});

app.get('/api/source-accounts', (_req, res) => {
  res.json({ accounts: listAccounts() });
});

app.delete('/api/source-accounts/:id', (req, res) => {
  deleteAccount(req.params.id);
  res.json({ ok: true });
});

app.post('/api/reddit/fetch-preview', async (req, res) => {
  try {
    const account = getAccount(req.body.accountId);
    if (!account) throw Object.assign(new Error('Unknown or disconnected Reddit account.'), { status: 404 });

    // Refresh shortly before expiry when a refresh token is available.
    if (account.refreshToken && account.expiresAt && new Date(account.expiresAt).getTime() < Date.now() + 60_000) {
      const refreshed = await refreshRedditToken(account.refreshToken);
      account.accessToken = refreshed.access_token || account.accessToken;
      if (refreshed.expires_in) account.expiresAt = new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString();
    }

    const posts = await fetchRedditUserPosts({
      accessToken: account.accessToken,
      username: account.username,
      postLimit: req.body.postLimit,
      period: req.body.period,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      includeReplies: !!req.body.includeReplies,
      includeMediaCaptions: !!req.body.includeMediaCaptions
    });

    // This preview endpoint intentionally returns only a small sample.
    // Production analysis passes normalized post text to the analysis engine server-side.
    res.json({
      account: {
        id: account.id,
        provider: account.provider,
        username: account.username,
        displayName: account.displayName
      },
      count: posts.length,
      sample: posts.slice(0, 5)
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

app.listen(port, () => {
  console.log(`Reddit API review server running on http://localhost:${port}`);
});
