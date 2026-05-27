# VYBE Audit Remediation Notes

This branch remediates the May 26, 2026 full-code audit against the current feature branch. The original audit was written against `main`; several findings were already fixed here before this pass.

## Fixed in Code

- Frontend metadata now includes SEO description, canonical URL, social cards, theme color, favicon, and web manifest.
- React startup is wrapped in `StrictMode`; the app has public URL routes for homepage, feature pages, login/signup, and legal policy placeholders.
- Frontend game question generation calls `/api/games/questions`; there are no direct browser calls to paid AI providers.
- Frontend auth uses backend `/api/auth/login` and `/api/auth/register`, stores the returned access token in app state, and loads `/api/me`.
- Viewer profile saves call `PATCH /api/me`; Spark purchases call `POST /api/sparks/purchase` when authenticated.
- Spark packages and loyalty sparkback rates match the closed-loop economy contract: 3%, 5%, 8%, and 10% for Silver through Diamond.
- Bonus Sparks are tracked with an `is_bonus`/`bonus_spark` ledger flag, 90-day expiry metadata, and separate purchased/bonus balances.
- Age-verification copy no longer claims a specific provider or privacy model before the provider integration is approved.
- Legal links resolve to real routes instead of `href="#"`.
- Stale future-dated mock relationship history has been moved to realistic 2026 dates.
- Backend refresh tokens now rotate with an active `jti` store, CSRF protection for cookie-bound refresh/logout, and tests for replay rejection.
- Backend registration/password updates enforce stronger password rules and 2FA setup/verification is covered by tests.
- Backend performer category filtering now works in PostgreSQL with the `performer_categories` table.
- Backend rate limiting can use Redis when `REDIS_URL` is configured.
- Backend dev CSP is enabled with local frontend and websocket allowances instead of disabling CSP entirely.
- Schema and migration coverage now include `priority_weight`, bonus Spark flags, daily login rewards, concierge assignments, and performer categories.

## Still Requires Production Integration

These are not safe to "fake-fix" in code because they require provider contracts, legal review, or infrastructure decisions:

- Final attorney-approved Terms, Privacy, DMCA, and 18 U.S.C. 2257 custodian language.
- Production age-verification provider integration and approval for launch jurisdictions.
- Production payment processor checkout/webhook flow; local Spark purchase remains a processor-reference contract, not raw card handling.
- Real live video/WebRTC or hosted streaming integration; the current room display remains a clearly staged product preview.
- Full performer onboarding workflow for identity, 2257 records, tax documents, agreements, payout setup, and moderation review.
- Large frontend modularization. The app is partially integrated with backend contracts, but `App.jsx` is still too large and should be split after current feature behavior is locked.
