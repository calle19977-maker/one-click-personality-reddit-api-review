# One Click Personality — Reddit API Review Repository

This repository is a minimal, review-focused version of the Reddit integration used by the One Click Personality website. It is intended to show how the application accesses Reddit's API without exposing the full proprietary product source code.

## What the app does

The production app is a standalone external website. A Redditor can connect their own Reddit account, choose a limited number of their own posts and optionally comments within a selected time period, and request a private communication-style/personality-style analysis for self-reflection. Reddit is one of several supported source platforms.

The analysis is generated only for the authenticated Redditor who requests it. The app is not a bot that posts, comments, votes, messages, moderates, follows users, or performs automated engagement on Reddit.

This review repository contains only the Reddit OAuth and post-fetching layer:

- server-side OAuth start and callback routes
- state validation for OAuth callbacks
- token exchange and refresh logic
- Reddit identity lookup via `/api/v1/me`
- read-only fetching of the authenticated user's submissions and, optionally, comments
- post limits and time-period filtering
- no scraping, posting, voting, messaging, resale, or AI model training
- no inference or reporting of sensitive characteristics such as health, political affiliation, sexual orientation, religion, ethnicity, or other protected/sensitive traits

## Responsible Builder Policy alignment

This project is designed to align with Reddit's Responsible Builder Policy:

- **Approval first:** Reddit API access will be used only after approval is granted.
- **Transparent purpose:** The app accesses Reddit data only for the user-requested self-reflection analysis described in this repository.
- **Read-only access:** The app requests only read-related OAuth scopes and does not manipulate Reddit features.
- **User consent:** The user must explicitly authenticate with Reddit OAuth before any Reddit data is fetched.
- **Limited access:** The user chooses the post/comment limit and time period. The server enforces caps and stops pagination when limits are reached.
- **No scraping/circumvention:** The app uses OAuth-authenticated API endpoints and does not scrape Reddit HTML or attempt to bypass rate limits.
- **No resale/dataset use:** Reddit data is not sold, licensed, redistributed, shared as a dataset, or used for ad targeting.
- **No AI/ML training:** Reddit data is not used to train, fine-tune, improve, benchmark, or build AI/ML models.
- **No sensitive inference:** The analysis must not infer or report sensitive characteristics, including health status, political affiliation, sexual orientation, religion, ethnicity, or similar protected/sensitive traits.
- **Commercial approval:** If the production service is monetized or used commercially, Reddit data will be used only with Reddit's explicit written approval and in compliance with Reddit's terms.

## Why Devvit is not used

Devvit is not suitable for this project because the product is a standalone external website, not a Reddit-native app that lives inside Reddit. The app needs a normal external-web OAuth flow, server-side callback handling, and platform-neutral source adapters for Reddit plus other services. Devvit's built-in Reddit API access is designed for Devvit apps running inside Reddit, while this product needs Reddit Data API access from an external server after the user grants OAuth permission.

## Requested Reddit OAuth scopes

```text
identity history read
```

Purpose:

- `identity`: confirm the Reddit username/account that granted access.
- `history` / `read`: read the authenticated user's selected posts and optional comments.

The app does not request scopes for posting, voting, private messages, moderation, or subreddit management.

## Data handling summary

- The user explicitly initiates Reddit connection through OAuth.
- The user chooses a post limit and time period before analysis.
- The server fetches only the selected user's Reddit submissions and optional comments through OAuth API endpoints.
- Reddit content is used as temporary input for a user-requested analysis.
- The app does not sell Reddit data, redistribute Reddit content, or use Reddit data to train, fine-tune, improve, benchmark, or build AI/ML models.
- The app does not infer or report sensitive characteristics such as health, political affiliation, sexual orientation, religion, ethnicity, or similar protected/sensitive traits.
- Users can disconnect a Reddit account and delete stored OAuth tokens in the production app.

See [`PRIVACY.md`](./PRIVACY.md) and [`docs/API_USAGE.md`](./docs/API_USAGE.md) for more detail.

## Local test setup

1. Create a Reddit web app at Reddit's app preferences page.
2. Set the redirect URI to:

```text
http://localhost:3000/source-auth/reddit/callback
```

3. Copy `Example.env` to `.env` and fill in your Reddit credentials.
4. Install and start:

```bash
npm install
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Files of interest for review

- [`src/redditOAuth.js`](./src/redditOAuth.js) — OAuth URL generation, code exchange, token refresh, identity lookup.
- [`src/redditPosts.js`](./src/redditPosts.js) — Reddit submissions/comments fetcher with limits and date filtering.
- [`src/server.js`](./src/server.js) — minimal Express server exposing the review flow.
- [`src/storage.js`](./src/storage.js) — intentionally simple token/account storage for review/demo purposes.
- [`Example.env`](./Example.env) — required environment variables with placeholders only.
