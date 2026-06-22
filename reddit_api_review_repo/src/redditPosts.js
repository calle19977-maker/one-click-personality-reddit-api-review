const DEFAULT_MAX_POSTS = 150;
const HARD_MAX_POSTS = 1000;

function redditHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
    'User-Agent': process.env.REDDIT_USER_AGENT || 'one-click-personality-review/1.0'
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

function normalizePostLimit(input) {
  const parsed = Number(input || DEFAULT_MAX_POSTS);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_POSTS;
  return Math.min(Math.floor(parsed), HARD_MAX_POSTS);
}

export function sourceDateRange({ period = 'last_30_days', fromDate = '', toDate = '' } = {}) {
  const now = new Date();
  const end = toDate ? new Date(`${toDate}T23:59:59.999Z`) : now;
  let start = null;

  if (period === 'custom' && fromDate) start = new Date(`${fromDate}T00:00:00.000Z`);
  if (period === 'last_7_days') start = new Date(now.getTime() - 7 * 86400_000);
  if (period === 'last_30_days') start = new Date(now.getTime() - 30 * 86400_000);
  if (period === 'last_90_days') start = new Date(now.getTime() - 90 * 86400_000);
  if (period === 'last_365_days') start = new Date(now.getTime() - 365 * 86400_000);
  if (period === 'all') start = null;

  return { start, end };
}

function dateInRange(isoDate, range) {
  if (!isoDate) return true;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return true;
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
}

function isOlderThanRange(isoDate, range) {
  if (!range.start || !isoDate) return false;
  const date = new Date(isoDate);
  return !Number.isNaN(date.getTime()) && date < range.start;
}

function cleanText(...parts) {
  return parts
    .map((part) => String(part || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function normalizeRedditListingItem(child, kind, includeMediaCaptions) {
  const data = child?.data || {};
  const createdAt = data.created_utc ? new Date(data.created_utc * 1000).toISOString() : '';
  const permalink = data.permalink ? `https://www.reddit.com${data.permalink}` : '';

  if (kind === 'comments') {
    return {
      type: 'comment',
      created_at: createdAt,
      url: permalink,
      text: cleanText(`Comment in r/${data.subreddit || ''}`, data.body)
    };
  }

  const mediaText = includeMediaCaptions
    ? cleanText(data.url_overridden_by_dest, data.link_url, data.media_title)
    : '';

  return {
    type: 'submission',
    created_at: createdAt,
    url: permalink,
    text: cleanText(data.title, data.selftext, mediaText)
  };
}

async function fetchListing({ accessToken, username, kind, limit, range, includeMediaCaptions }) {
  const endpoint = kind === 'comments' ? 'comments' : 'submitted';
  const items = [];
  let after = '';

  for (let page = 0; page < 10 && items.length < limit; page += 1) {
    const params = new URLSearchParams({ limit: '100', sort: 'new', raw_json: '1' });
    if (after) params.set('after', after);

    const url = `https://oauth.reddit.com/user/${encodeURIComponent(username)}/${endpoint}?${params.toString()}`;
    const data = await fetchJson(url, { headers: redditHeaders(accessToken) });
    const children = data?.data?.children || [];

    for (const child of children) {
      const item = normalizeRedditListingItem(child, kind, includeMediaCaptions);
      if (!item.text || !dateInRange(item.created_at, range)) continue;
      items.push(item);
      if (items.length >= limit) break;
    }

    if (children.some((child) => {
      const createdAt = child?.data?.created_utc ? new Date(child.data.created_utc * 1000).toISOString() : '';
      return isOlderThanRange(createdAt, range);
    })) break;

    after = data?.data?.after || '';
    if (!after) break;
  }

  return items;
}

export async function fetchRedditUserPosts({
  accessToken,
  username,
  postLimit = DEFAULT_MAX_POSTS,
  period = 'last_30_days',
  fromDate = '',
  toDate = '',
  includeReplies = false,
  includeMediaCaptions = false
}) {
  const limit = normalizePostLimit(postLimit);
  const range = sourceDateRange({ period, fromDate, toDate });

  const submissions = await fetchListing({
    accessToken,
    username,
    kind: 'submitted',
    limit,
    range,
    includeMediaCaptions
  });

  let combined = submissions;

  if (includeReplies && combined.length < limit) {
    const comments = await fetchListing({
      accessToken,
      username,
      kind: 'comments',
      limit: limit - combined.length,
      range,
      includeMediaCaptions: false
    });
    combined = combined.concat(comments);
  }

  const deduped = [];
  const seen = new Set();
  for (const item of combined.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))) {
    const key = item.url || `${item.created_at}:${item.text.slice(0, 160)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= limit) break;
  }

  return deduped;
}
