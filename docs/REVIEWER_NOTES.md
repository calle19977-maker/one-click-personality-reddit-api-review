# Reviewer Notes

This repository is intentionally smaller than the production app. It exists to make the Reddit API usage easy to review.

The production application also includes Gemini analysis logic and other source-provider adapters. Those parts are excluded from this review repository to avoid publishing unrelated proprietary code. The files included here are the relevant Reddit OAuth/Data API integration layer.

The Reddit integration is server-side. Browser code never receives Reddit OAuth client secrets, access tokens, or refresh tokens.

## GitHub repository URL

https://github.com/calle19977-maker/one-click-personality-reddit-api-review

No public staging URL yet.

## Responsible Builder Policy commitments

The app is intended to be user-authorized, read-only, transparent, and limited in scope.

- Reddit API access will be used only after approval is granted.
- The user must explicitly authenticate with Reddit OAuth before any Reddit data is fetched.
- The app fetches only the authenticated user's selected posts and optional comments.
- The user chooses the amount of content and the time period before analysis.
- The app does not scrape Reddit HTML or attempt to bypass API limits.
- The app does not post, comment, vote, message, moderate, follow users, or automate engagement on Reddit.
- Reddit data is not sold, licensed, redistributed, shared as a dataset, or used for ad targeting.
- Reddit data is not used to train, fine-tune, improve, benchmark, or build AI/ML models.
- The analysis must not infer or report sensitive characteristics, including health status, political affiliation, sexual orientation, religion, ethnicity, or similar protected/sensitive traits.
- If the production service is monetized or used commercially, Reddit data will be used only with Reddit's explicit written approval and in compliance with Reddit's terms.

## Devvit note

The project is a standalone external website that supports multiple source platforms. Devvit is not used because the app needs an external OAuth callback flow and a platform-neutral source adapter architecture. It is not a Reddit-native app that lives inside Reddit.
