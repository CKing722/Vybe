# VYBE Backend API Contracts

This is the current backend contract for frontend integration. It is no-spend in local development: if `DATABASE_URL` is empty, the backend serves deterministic development data from the memory adapter. With `DATABASE_URL` set, the same routes use PostgreSQL.

## Local Backend

```bash
cd backend
npm install
npm start
```

Base URL:

```text
http://localhost:4000
```

Demo viewer login:

```json
{
  "email": "viewer@vybe.local",
  "password": "vybe-demo"
}
```

Demo performer:

```text
luna / Luna Voss
luna@vybe.local / vybe-demo
```

## Database

Fresh local database:

```bash
cd backend
npm run db:schema
```

Existing database migrations:

```bash
cd backend
npm run db:migrate
```

## Auth

### `GET /api/auth/csrf`

Returns a CSRF token and sets the readable `vybe_csrf` cookie used by cookie-bound auth mutations such as refresh and logout.

Response:

```json
{
  "csrfToken": "...",
  "headerName": "x-vybe-csrf"
}
```

Send the token back in the returned header name when calling CSRF-protected cookie routes.

### `POST /api/auth/register`

Request:

```json
{
  "email": "new.viewer@vybe.local",
  "password": "Stronger1!",
  "display_name": "KnownPatron",
  "role": "viewer",
  "phone_number": "555-0100"
}
```

Passwords must be 8-72 characters and include at least one uppercase letter, one lowercase letter, one number, and one symbol. Registration returns the same auth envelope as login.

### `POST /api/auth/login`

Request:

```json
{
  "email": "viewer@vybe.local",
  "password": "vybe-demo"
}
```

Response:

```json
{
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "email": "viewer@vybe.local",
    "display_name": "VelvetKing",
    "role": "viewer"
  },
  "accessToken": "...",
  "expiresInSeconds": 900
}
```

Use the access token as:

```text
Authorization: Bearer <accessToken>
```

If 2FA is enabled, login returns `401` with `code: "TWO_FACTOR_REQUIRED"` until the request includes a valid `twoFactorToken`.

### `POST /api/auth/refresh`

Requires the `vybe_refresh` httpOnly cookie, the `vybe_csrf` cookie, and the `x-vybe-csrf` header from `/api/auth/csrf`.

Refresh tokens rotate on every successful call. Reusing an older refresh token returns `401` and clears the cookie.

### `POST /api/auth/logout`

Requires CSRF in the same way as refresh. Revokes the active refresh token and clears auth cookies.

### `POST /api/auth/2fa/setup`

Requires auth. Returns a TOTP secret and `otpauth://` URL so the client can render a QR code.

### `POST /api/auth/2fa/verify`

Requires auth. Verifies the setup token and enables 2FA for the account.

## Viewer

### `GET /api/me`

Requires auth.

Returns the current viewer, spark balance, loyalty tier, and performer history.

### `PATCH /api/me`

Requires auth. Updates editable account fields and returns the same profile envelope as `GET /api/me`.

Request:

```json
{
  "displayName": "Known Patron",
  "email": "known@vybe.local",
  "phoneNumber": "555-0100",
  "bio": "A short profile note."
}
```

### `PUT /api/me/password`

Requires auth. Validates the current password and applies the same password strength rules as registration.

Request:

```json
{
  "currentPassword": "vybe-demo",
  "newPassword": "N3wStrong!Pass"
}
```

Response:

```json
{
  "passwordUpdated": true
}
```

### `GET /api/me/history/:performerId`

Requires auth. Accepts a performer UUID or slug and returns the viewer's relationship summary plus recent gifts/sessions for that performer.

## Performers

### `GET /api/performers`

Query parameters:

- `live=true`
- `category=Interactive`
- `sort=viewers`
- `q=luna`

Returns:

```json
{
  "performers": [
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "slug": "luna",
      "roomId": "33333333-3333-4333-8333-333333333333",
      "name": "Luna Voss",
      "vibe": "Sultry game show host energy",
      "isLive": true
    }
  ]
}
```

### `GET /api/performers/:id`

Accepts the demo slug `luna` or a performer UUID.

Returns one performer with caps, requests, posts, schedule, stats, and room id.

## Sparks

### `GET /api/sparks/balance`

Requires auth.

Returns:

```json
{
  "sparks": 10000,
  "purchasedSparks": 9000,
  "bonusSparks": 1000,
  "bonusSparksExpiresAt": "2026-08-25T00:00:00.000Z",
  "totalSpent": 0,
  "closedLoop": true,
  "cashOutAllowed": false,
  "transferAllowed": false,
  "loyalty": {
    "name": "Bronze",
    "min": 0,
    "sparkBack": 0,
    "color": "#cd7f32"
  }
}
```

### `GET /api/sparks/transactions`

Requires auth.

Returns the current viewer's spark ledger entries.

### `GET /api/sparks/packages`

Returns real purchase package contracts and closed-loop rules.

### `POST /api/sparks/purchase`

Requires auth. Records a package purchase against a processor-hosted payment method reference and credits purchased and bonus Sparks separately.

Request:

```json
{
  "package_id": "popular",
  "payment_method_id": "processor-token-id",
  "processor": "ccbill"
}
```

Bonus Sparks expire after 90 days and are spent before purchased Sparks.

Ledger rows include `isBonus` so bonus Spark purchases, sparkback, and FIFO spend/refund behavior can be reconciled separately from purchased Sparks.

## Performer Requests

Requests are not public when first submitted. They are held in Spark escrow and sent only to the performer approval lane. If declined, the viewer is refunded with the original purchased/bonus Spark split.

### `GET /api/requests/performers/:performerId/menu`

Returns a performer's active request menu.

### `POST /api/requests/purchase`

Requires viewer auth.

```json
{
  "performer_id": "22222222-2222-4222-8222-222222222222",
  "request_id": "22222222-2222-4222-8222-222222222222:ultimate-fantasy",
  "prompt": "A consent-safe custom moment"
}
```

Response status is `pending` and `publicVisible` is `false`.

### `GET /api/requests/mine`

Requires viewer auth. Lists the viewer's request history.

### `GET /api/requests/performer?status=pending`

Requires performer or admin auth. Lists the private performer approval queue.

### `POST /api/requests/:id/accept`

Requires performer or admin auth. Marks the request accepted, makes it public, records performer earnings, and emits `request_accepted`.

### `POST /api/requests/:id/decline`

Requires performer or admin auth. Marks the request declined, refunds the viewer, and emits `request_declined_refunded`.

## Payments

### `GET /api/payments/options`

Returns supported payment rails and safety policy. VYBE stores provider references only, not raw card or raw wallet custody data.

### `GET /api/payments/methods`

Requires auth. Lists saved provider-backed payment references.

### `POST /api/payments/methods`

Requires auth. Adds a provider-backed payment reference.

```json
{
  "type": "crypto_wallet",
  "provider": "coinbase_commerce",
  "provider_ref": "processor-token",
  "chain": "base",
  "wallet_address": "0x...",
  "is_default": true
}
```

## Compliance

### `GET /api/compliance/adult-access`

Requires auth. Returns age-verification and geo-block status before adult content is exposed.

### `POST /api/compliance/age-verification`

Requires auth. Records a third-party age verification reference token.

### `POST /api/compliance/performer-verification`

Requires performer/admin auth. Records performer identity and 2257 verification state. Performers should not go live, upload content, receive bookings, or receive payouts until verified.

### `GET /api/compliance/overview`

Requires admin auth. Returns compliance dashboard counts for age verification, performer 2257 state, moderation, and DMCA queue.

## Gifts

### `GET /api/gifts/types`

Returns all gift definitions, including animation type and duration.

### `POST /api/gifts/send`

Requires auth.

Request:

```json
{
  "performer_id": "22222222-2222-4222-8222-222222222222",
  "gift_type_id": "crown",
  "room_id": "33333333-3333-4333-8333-333333333333"
}
```

Response includes:

- `giftSent`
- updated `balance`
- `animation` payload for the room
- `banner` payload for 500+ spark platform-wide gifts

Socket events:

- `gift_animation`
- `platform_banner`
- `spark_storm_start`
- `spark_storm_update`
- `spark_storm_complete`

## Platform Banners

### `GET /api/banners/active`

Returns active platform-wide banners.

## Game Questions

### `POST /api/games/questions`

This endpoint is the frontend-safe replacement for direct browser AI calls.

It uses local no-cost questions. Raw provider API calls are disabled for VYBE under the current no-API rule.

Request:

```json
{
  "theme": "spark storm",
  "count": 5
}
```
