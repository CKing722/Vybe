# VYBE Backend Architecture - Codex Build Spec

## Stack
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL 16 (schema in `schema.sql`)
- **Cache:** Redis 7
- **Real-time:** Socket.io (WebSocket)
- **Auth:** JWT (access + refresh tokens), bcrypt, TOTP 2FA
- **Storage:** Cloudflare R2 (S3-compatible) for media
- **Payments:** CCBill API (adult-friendly processor)

## Project Structure
```
backend/
|-- server.js            # Express + Socket.io setup
|-- routes/
|   |-- auth.js          # register, login, logout, refresh, 2fa
|   |-- users.js         # profile CRUD, viewer identity
|   |-- performers.js    # performer profiles, capabilities, schedule
|   |-- sparks.js        # purchase, balance, transactions, sparkback
|   |-- gifts.js         # send gift, gift history, platform banners
|   |-- sessions.js      # book, start, end sessions
|   |-- requests.js      # performer request menu CRUD, purchase
|   |-- subscriptions.js # subscribe, cancel, status
|   |-- content.js       # post, upload, purchase, feed
|   |-- games.js         # game sessions, results, leaderboards
|   |-- chat.js          # DM send, read, list conversations
|   |-- community.js     # spark storms, presence points, achievements
|   `-- admin.js         # moderation, compliance, analytics
|-- middleware/
|   |-- auth.js          # JWT verification, role checking
|   |-- rateLimiter.js   # per-endpoint rate limits
|   |-- validator.js     # input sanitization (express-validator)
|   |-- security.js      # CORS, helmet, CSP headers
|   `-- upload.js        # multer + R2 upload pipeline
|-- models/              # Knex query builders per table
|-- sockets/
|   |-- chatHandler.js   # real-time chat messages
|   |-- giftHandler.js   # real-time gift animations + platform banners
|   |-- gameHandler.js   # real-time game state sync
|   `-- stormHandler.js  # spark storm events
|-- services/
|   |-- sparkEngine.js   # spark transactions with balance checks
|   |-- loyaltyEngine.js # tier calculations, sparkback rates
|   |-- bannerService.js # platform-wide gift banners
|   `-- aiQuestions.js   # local/mock game questions; no raw provider APIs
`-- config/
    |-- db.js            # PostgreSQL connection pool (pg)
    |-- redis.js         # Redis client
    `-- r2.js            # Cloudflare R2 client
```

## Security Requirements (Non-negotiable)
1. All passwords hashed with bcrypt (cost factor 12)
2. JWT access tokens expire in 15 minutes, refresh tokens in 7 days
3. Refresh tokens stored in httpOnly secure sameSite cookies
4. CSRF token on all state-changing requests
5. Rate limiting: 5 login attempts per 15min per IP, 100 API calls/min per user
6. All inputs validated and sanitized (express-validator)
7. SQL parameterized queries only (no string concatenation)
8. Helmet.js for security headers (HSTS, CSP, X-Frame-Options)
9. CORS restricted to frontend domain only
10. File uploads: type checking, size limits (50MB video, 10MB image), virus scan
11. All spark transactions use database transactions (BEGIN/COMMIT) with balance checks
12. Audit log for all financial transactions

## Revenue Split Logic
```
When viewer spends X sparks on a performer:
  performer_earnings = floor(X * 0.80)
  platform_fee = X - performer_earnings
  
  INSERT spark_transaction for viewer (debit)
  INSERT spark_transaction for performer (credit)
  UPDATE viewer_profiles.sparks (decrease)
  UPDATE viewer_profiles.total_spent (increase by USD equivalent)
  -- All in single DB transaction
```

## WebSocket Events (Socket.io)
```
Client -> Server:
  'join_room' { room_id }
  'leave_room' { room_id }
  'chat_message' { room_id, message }
  'send_gift' { room_id, gift_type_id }
  'game_answer' { game_session_id, answer_index }
  'send_request' { performer_id, request_id }

Server -> Client:
  'chat_message' { sender, message, badges, tier }
  'gift_animation' { sender, gift, animation_type, duration }
  'platform_banner' { sender, performer, gift, sparks } - broadcast to ALL rooms
  'spark_storm_start' { target, timer }
  'spark_storm_update' { current, level }
  'spark_storm_complete' { reward_per_participant }
  'game_state' { question, timer, scores }
  'viewer_count' { count }
  'performer_status' { is_live }
  'leaderboard_update' { performer, entries, viewerEntry }
```

## Key API Endpoints
```
POST   /api/auth/register        { email, password, name, role }
POST   /api/auth/login            { email, password }
POST   /api/auth/refresh          (cookie-based)
POST   /api/auth/logout
POST   /api/auth/2fa/setup
POST   /api/auth/2fa/verify

GET    /api/performers            ?category=&sort=&live=true
GET    /api/performers/:id        (full profile + capabilities + schedule)
GET    /api/performers/:id/feed   (content posts, paginated)
GET    /api/performers/:id/requests (request menu)

GET    /api/me                    (current user profile + viewer identity)
GET    /api/me/achievements
GET    /api/me/history/:performerId
PUT    /api/me/profile            { display_name, avatar, bio }

POST   /api/sparks/purchase       { package_id, payment_token }
GET    /api/sparks/balance
GET    /api/sparks/transactions   ?page=&limit=

POST   /api/gifts/send            { performer_id, gift_type_id, room_id }
GET    /api/gifts/types

POST   /api/sessions/book         { performer_id, package_id }
POST   /api/sessions/:id/end

POST   /api/subscriptions/subscribe { performer_id }
DELETE /api/subscriptions/:performerId

POST   /api/content/post          (multipart: text, media, price, subscriber_only)
GET    /api/content/feed/:performerId
POST   /api/content/:id/purchase

GET    /api/games/leaderboard/:performerId
POST   /api/games/questions       (local/mock question generation; no raw provider APIs)

GET    /api/chat/conversations    (DM list)
GET    /api/chat/:userId          (messages with user)
POST   /api/chat/send             { recipient_id, message }

GET    /api/banners/active        (current platform-wide banners)
```

## Environment Variables
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random>
BCRYPT_ROUNDS=12
R2_ENDPOINT=https://...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=vybe-media
CCBILL_MERCHANT_ID=...
CCBILL_SUB_ACCOUNT=...
# Raw provider APIs are disabled for VYBE product features.
FRONTEND_URL=https://vybe.app
NODE_ENV=production
```
