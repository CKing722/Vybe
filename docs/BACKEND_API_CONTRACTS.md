# VYBE Backend API Contracts

This is the current local contract for frontend integration. It is intentionally no-spend: if `DATABASE_URL` is empty in development, the backend serves deterministic demo data from the memory adapter.

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
```

## Auth

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

### `POST /api/auth/2fa/setup`

Requires auth.

Returns a new TOTP secret + `otpauth://` URL for QR setup. This does not enable 2FA until verified.

Response:

```json
{
  "issuer": "VYBE",
  "label": "viewer@vybe.local",
  "otpauthUrl": "otpauth://totp/...",
  "secret": "BASE32..."
}
```

### `POST /api/auth/2fa/verify`

Requires auth.

Request:

```json
{
  "token": "123456"
}
```

After verification, `POST /api/auth/login` requires a 2FA token for accounts with 2FA enabled:

```json
{
  "email": "viewer@vybe.local",
  "password": "vybe-demo",
  "twoFactorToken": "123456"
}
```

## Viewer

### `GET /api/me`

Requires auth.

Returns the current viewer, spark balance, loyalty tier, and performer history.

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
  "totalSpent": 0,
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
