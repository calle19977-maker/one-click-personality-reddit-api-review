# Privacy and Data Use Summary

This document describes the intended Reddit data handling for One Click Personality.

## User authorization

Reddit data is accessed only after the user explicitly starts the Reddit connection flow and approves OAuth access. The app does not access Reddit data on behalf of users who have not connected their account.

## Data collected from Reddit

The app may fetch:

- the authenticated Reddit account identity, such as username and account id;
- the authenticated user's selected submissions;
- the authenticated user's comments only when the user enables the comments/replies option;
- post metadata required for filtering, such as creation time and permalink.

The app does not fetch private messages, moderation data, voting data, or unrelated subreddit data.

## Purpose of use

Reddit content is used only as input for a personality-style analysis requested by the authenticated user. The app does not resell Reddit data, redistribute Reddit content, create public datasets, or use Reddit data to train AI models.

## Retention

In production, OAuth tokens are stored server-side so the user does not need to reauthorize on every analysis. Tokens are not exposed to the browser. Users can disconnect their Reddit account, which deletes stored OAuth tokens for that source account.

Fetched post/comment text should be treated as temporary analysis input. The intended production behavior is to keep only what is necessary to provide the requested analysis and to avoid retaining raw Reddit text longer than needed.

## User controls

The user can control:

- whether to connect Reddit;
- how many posts to analyze, subject to platform caps;
- the time period to analyze;
- whether comments/replies are included;
- whether media captions/descriptions are included where available;
- whether to disconnect/delete the verified Reddit source account.

## Security

API credentials, OAuth client secrets, OAuth access tokens, and refresh tokens must never be committed to source control. They belong only in server-side environment variables or encrypted server-side storage.

## Contact information

E-mail: calle1997@hotmail.com