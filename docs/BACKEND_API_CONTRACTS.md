# VYBE Backend API Contracts

This is the current local contract for frontend integration. It is intentionally no-spend: if `DATABASE_URL` is empty in development, the backend serves deterministic demo data from the memory adapter.

## Machine-Readable Contracts

- HTTP (OpenAPI): `backend/contracts/openapi.yaml`
- Realtime (AsyncAPI over Socket.io): `backend/contracts/asyncapi.yaml`
- Realtime payloads (JSON Schema, canonical): `backend/contracts/socketio/v1/**`

Validation:

```bash
cd backend
npm run check
```

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

### `GET /api/auth/csrf`

Sets a CSRF cookie and returns the token the frontend must echo back in the `x-vybe-csrf` header for cookie-auth endpoints (refresh/logout).

Response:

```json
{
  "csrfToken": "...",
  "headerName": "x-vybe-csrf"
}
```

### `POST /api/auth/refresh`

Cookie-auth endpoint.

Requirements:

- `Cookie: vybe_refresh=...; vybe_csrf=...`
- `x-vybe-csrf: <value of vybe_csrf cookie>`

Returns a new access token.

### `POST /api/auth/logout`

Cookie-auth endpoint.

Requirements:

- `Cookie: vybe_refresh=...; vybe_csrf=...`
- `x-vybe-csrf: <value of vybe_csrf cookie>`

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

Response:

```json
{
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "email": "viewer@vybe.local",
    "displayName": "VelvetKing",
    "role": "viewer",
    "avatarUrl": null,
    "bannerUrl": null,
    "bio": null,
    "isVerified": false
  },
  "viewer": {
    "sparks": 10000,
    "totalSpent": 0,
    "gamesPlayed": 0,
    "gamesWon": 0,
    "winRate": 0,
    "topStreak": 0,
    "sparksEarned": 0,
    "totalSessions": 0,
    "reputationScore": 0,
    "loyalty": {
      "name": "Bronze",
      "min": 0,
      "sparkBack": 0,
      "color": "#cd7f32"
    }
  },
  "performerHistory": []
}
```

### `GET /api/me/achievements`

Requires auth.

Returns the viewer's earned achievements (demo data is deterministic when the memory adapter is active).

Returns:

```json
{
  "userId": "11111111-1111-4111-8111-111111111111",
  "achievements": [
    {
      "id": "96aaedcb-361f-9690-c485-1b9d41e991da",
      "key": "first_win",
      "title": "First Win",
      "description": "Win your first game.",
      "category": "games",
      "achievedAt": "2026-01-09T18:00:00.000Z"
    }
  ]
}
```

### `GET /api/me/history/:performerId`

Requires auth.

Query parameters:

- `limit` (default 25, max 100)

Returns a `summary` of the viewer's relationship with the performer plus a `gifts` list suitable for the "Your History" UI section.

Notes:

- `:performerId` accepts either a performer UUID or demo slug (e.g. `luna`).

Response:

```json
{
  "performer": {
    "id": "22222222-2222-4222-8222-222222222222",
    "slug": "luna",
    "name": "Luna Voss",
    "roomId": "33333333-3333-4333-8333-333333333333",
    "accent": "#ff2d78"
  },
  "summary": {
    "sessionsCount": 0,
    "sparksSpent": 0,
    "isSubscribed": false,
    "firstInteraction": null,
    "lastInteraction": null
  },
  "gifts": []
}
```

### `PUT /api/me/profile`

Requires auth.

Request:

```json
{
  "display_name": "NeonVelvet",
  "avatar": "https://cdn.vybe.local/avatars/neon.png",
  "bio": "I only gift in cinematic."
}
```

Response: same shape as `GET /api/me` with updated `user` fields.

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

### `GET /api/performers/:id/feed`

Query parameters:

- `limit` (default 25, max 100)

Returns the performer content feed (demo data is deterministic when the memory adapter is active):

```json
{
  "performerId": "22222222-2222-4222-8222-222222222222",
  "posts": [
    {
      "id": "7b0ac662-3ed0-3f19-d9a4-5d463aa4febb",
      "type": "text",
      "text": "Tonight's trivia: spicy confessions. Bring it.",
      "mediaUrl": null,
      "mediaThumbnailUrl": null,
      "isSubscriberOnly": false,
      "sparkPrice": 0,
      "isEphemeral": false,
      "expiresAt": null,
      "likeCount": 0,
      "commentCount": 0,
      "viewCount": 0,
      "createdAt": "2026-01-09T22:00:00.000Z"
    }
  ]
}
```

### `GET /api/performers/:id/requests`

Returns the performer request menu:

```json
{
  "performerId": "22222222-2222-4222-8222-222222222222",
  "requests": [
    {
      "id": "f4b88fbf-25af-9d22-71c0-0f0e50c11849",
      "name": "Song & Vibe",
      "description": "She plays your song",
      "sparkCost": 150,
      "sortOrder": 0,
      "isActive": true,
      "createdAt": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

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
- `leaderboard` snapshot for the performer (top spenders + sender rank when available)

Socket events:

- `gift_animation`
- `platform_banner`
- `leaderboard_update`
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

Response:

```json
{
  "provider": "local",
  "paidProviderUsed": false,
  "rawProviderApisEnabled": false,
  "questions": [
    {
      "q": "Which room detail sets the strongest mood before a private session starts?",
      "opts": ["Lighting", "Volume", "Camera angle", "Opening line"],
      "ans": 0
    }
  ]
}
```

## Game Leaderboard

### `GET /api/games/leaderboard/:performerId`

Memory adapter supports demo performer slug (e.g. `luna`). Database mode expects the performer UUID.

Query parameters:

- `limit` (default 10, max 25)

Response:

```json
{
  "performer": {
    "id": "22222222-2222-4222-8222-222222222222",
    "slug": "luna",
    "name": "Luna Voss"
  },
  "entries": [
    {
      "rank": 1,
      "user": {
        "id": "11111111-1111-4111-8111-111111111111",
        "displayName": "VelvetKing",
        "role": "viewer",
        "avatarUrl": null
      },
      "sparksSpent": 505,
      "giftsSent": 2
    }
  ],
  "generatedAt": "..."
}
```

## Chat (DM)

These endpoints power direct messages and are backed by the memory adapter when `DATABASE_URL` is unset.

### `GET /api/chat/conversations`

Requires auth.

Returns:

```json
{
  "conversations": [
    {
      "user": {
        "id": "22222222-2222-4222-8222-222222222222",
        "displayName": "Luna Voss",
        "role": "performer",
        "avatarUrl": null
      },
      "lastMessage": {
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "senderId": "22222222-2222-4222-8222-222222222222",
        "recipientId": "11111111-1111-4111-8111-111111111111",
        "message": "Welcome back. Want me to pick the first game, or do you want to run the board?",
        "createdAt": "..."
      },
      "lastMessageAt": "...",
      "unreadCount": 1
    }
  ]
}
```

### `GET /api/chat/:userId`

Requires auth.

Returns messages with one user (accepts demo performer slug like `luna` or a UUID).

### `POST /api/chat/send`

Requires auth.

Request:

```json
{
  "recipient_id": "luna",
  "message": "Put me on the leaderboard."
}
```
