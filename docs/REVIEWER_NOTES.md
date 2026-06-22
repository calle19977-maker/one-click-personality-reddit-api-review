# Reviewer Notes

This repository is intentionally smaller than the production app. It exists to make the Reddit API usage easy to review.

The production application also includes Gemini analysis logic and other source-provider adapters. Those parts are not necessary to understand the Reddit API access pattern and are excluded from this review repository to avoid publishing unrelated proprietary code.

The Reddit integration is server-side. Browser code never receives Reddit OAuth client secrets, access tokens, or refresh tokens.

## GitHub repository URL

https://github.com/calle19977-maker/one-click-personality-reddit-api-review

No public staging URL yet.
