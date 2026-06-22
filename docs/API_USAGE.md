# Reddit API Usage

## OAuth flow

1. The user clicks "Login/verify new user" for Reddit.
2. The server creates a random OAuth `state` value.
3. The user is redirected to Reddit's OAuth authorization page.
4. Reddit redirects back to `/source-auth/reddit/callback` with `code` and `state`.
5. The server validates `state` and exchanges the authorization code for tokens.
6. The server calls `https://oauth.reddit.com/api/v1/me` to identify the connected account.
7. Tokens are stored server-side and are not sent to the browser.

## Read endpoints used

The review code uses OAuth-authenticated API calls only:

```text
GET https://oauth.reddit.com/api/v1/me
GET https://oauth.reddit.com/user/{username}/submitted
GET https://oauth.reddit.com/user/{username}/comments
POST https://www.reddit.com/api/v1/access_token
```

## Limits and filtering

The user selects a maximum post count. The server enforces a maximum cap and paginates through Reddit listings with `limit=100`, stopping when:

- the requested count is reached;
- there are no more pages;
- fetched items are older than the selected time period;
- a safety page cap is reached.

## No scraping or automation

The integration does not scrape Reddit HTML pages. It uses OAuth-authenticated JSON API endpoints. It does not post, vote, message, follow, moderate, or automate engagement.

## User-Agent

Requests include a descriptive User-Agent configured via `REDDIT_USER_AGENT`.
