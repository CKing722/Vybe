# VYBE — Linear Project Board

## Epic 1: Foundation
- [ ] Monorepo setup (frontend + backend)
- [ ] PostgreSQL database from schema.sql
- [ ] Express server with middleware (auth, rate limit, CORS, helmet)
- [ ] Redis connection for sessions/cache
- [ ] Cloudflare R2 bucket for media storage
- [ ] Environment config and secrets management
- [ ] CI/CD pipeline (GitHub Actions)

## Epic 2: Auth & Security
- [ ] User registration (viewer + performer roles)
- [ ] Login with JWT (access + refresh tokens)
- [ ] Password hashing (bcrypt, cost 12)
- [ ] Refresh token rotation in httpOnly cookies
- [ ] CSRF protection on all state-changing routes
- [ ] Rate limiting (5 login/15min, 100 API/min)
- [ ] 2FA setup and verify (TOTP)
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Session management (list active, force logout)
- [ ] Input validation on all endpoints (express-validator)

## Epic 3: Frontend Visual Overhaul
- [ ] Design system: color tokens, typography (display + body), spacing scale
- [ ] Component library: Button, Card, Panel, Tag, Badge, Input, Modal
- [ ] Canvas particle system for gift animations (7 tiers)
- [ ] Animated gradient borders on cards
- [ ] Glassmorphism with layered depth
- [ ] Hover micro-interactions on all interactive elements
- [ ] Page transition animations between views
- [ ] Platform-wide gift notification banner (slides across top)
- [ ] Staggered content reveal animations
- [ ] Performer card glow effects (accent color aura)
- [ ] CSS gradient mesh backgrounds
- [ ] Loading skeleton states

## Epic 4: Lobby
- [ ] Performer grid with live status, viewers, heat level
- [ ] Category filtering (14 categories)
- [ ] Hamburger menu with categories + account links
- [ ] Featured performer hero card with ambient glow
- [ ] Search performers
- [ ] Sort: popular, trending, new, top rated
- [ ] "How VYBE Works" section
- [ ] 11 game mode showcase
- [ ] Legal footer (2257, terms, privacy, DMCA)

## Epic 5: Performer Profiles
- [ ] Profile page with banner, avatar, bio, tags
- [ ] Stats display (sessions, hours, followers, rating)
- [ ] "Your History" section (viewer's history with this performer)
- [ ] Game modes grid (filtered by performer capabilities)
- [ ] Request menu (performer-priced custom experiences)
- [ ] Content feed (text, photo, video posts)
- [ ] Subscription card (performer-controlled pricing, trial option)
- [ ] Schedule display
- [ ] Watch Live / Book / VIP action buttons
- [ ] Subscriber-only content with blurred previews

## Epic 6: Live Room
- [ ] Full-screen performer stage with ambient effects
- [ ] Real-time chat via WebSocket (send, receive, scroll)
- [ ] Chat hide/show toggle
- [ ] Gift panel with 7 tiers
- [ ] Canvas gift animations (bloom → cinematic, scaled by cost)
- [ ] Gift sender name display (duration scaled by cost)
- [ ] Games panel (filtered by performer)
- [ ] Request panel (performer's custom menu)
- [ ] Leaderboard panel with viewer badges
- [ ] Action bar: Gift, Games, Request, Board, Book, VIP, Top Up, Chat
- [ ] Single-panel enforcement (one panel at a time)
- [ ] Spark balance + top-up in room
- [ ] Session timer
- [ ] Viewer count with avatar stack
- [ ] Spark-back notifications (green overlay)
- [ ] Spark Storm progress bar (community hype event)
- [ ] Platform-wide banner when 500+ spark gift sent

## Epic 7: Gift Animation System
- [ ] Canvas overlay layer in live room
- [ ] Particle class: position, velocity, color, size, lifetime, shape
- [ ] Bloom effect (5 sparks): 10-15 particles, small, corner placement, 1.5s
- [ ] Trail effect (25 sparks): 30 particles, flame trail across bottom, 2s
- [ ] Float effect (50 sparks): 20 heart particles drifting up, 2.5s
- [ ] Rain effect (150 sparks): 50 diamond particles cascading, sender name gold, 4s
- [ ] Descend effect (500 sparks): crown + 80 gold particles, chat goes gold, 6s
- [ ] Burst effect (2500 sparks): bottle pop + 150 particles fill screen, 8s
- [ ] Cinematic effect (5000 sparks): screen dim, spotlight, key turn, 200 particles, 15s
- [ ] Sender name overlay (duration and size scales with gift cost)
- [ ] Sound hooks for each tier (muted by default)

## Epic 8: Game Engines
- [ ] Tease Trivia — multiple choice, AI questions, streak meter
- [ ] Spin & Sin — animated wheel with segments, physics
- [ ] Truth or Dare — card flip, binary choice
- [ ] Hot Seat — countdown timer, elimination
- [ ] Card Clash — head-to-head card reveal
- [ ] Fantasy Auction — live bidding with timer
- [ ] King of the Hill — cumulative scoring, rounds
- [ ] Mystery Box — 6 boxes, random prizes, open animation
- [ ] Dare Ladder — 5 rungs, climb or bank, escalating
- [ ] Buzz Battle — reaction time, visual signal
- [ ] All-In Jackpot — 3 lives, 10-streak = free session
- [ ] AI question generation via Anthropic API
- [ ] Unique visual identity per game mode
- [ ] Game result → viewer stats update

## Epic 9: Performer Studio
- [ ] Sidebar navigation (Home, Content, Inbox, Store, Analytics, Settings)
- [ ] Home: earnings, top fans, quick post, go live button
- [ ] Content Studio: upload photos/videos/audio, set prices, post updates
- [ ] Inbox: subscriber DMs, split-panel messaging, online indicators
- [ ] Store: request menu editor, premium content, merch integration
- [ ] Analytics: revenue by source, best games, audience insights
- [ ] Settings: subscription price, payout, security, game modes, schedule
- [ ] Go Live flow (start broadcast)
- [ ] Performer skips age verification (already 2257 verified)

## Epic 10: Spark Economy
- [ ] Spark purchase flow with 6 tiers + price anchoring
- [ ] Wallet display with balance + loyalty tier
- [ ] Loyalty tiers (Bronze→Diamond) based on lifetime spend
- [ ] Spark-back calculation per tier (0-20%)
- [ ] Transaction history
- [ ] Auto-reload option
- [ ] Revenue split: 80% performer, 20% platform
- [ ] Payout system for performers (CCBill/Segpay)

## Epic 11: Identity & Community
- [ ] Viewer profile with persistent stats
- [ ] Achievement system (10 achievements, rarity levels)
- [ ] Viewer-performer history tracking
- [ ] Subscriber badges (evolving: 1mo/3mo/6mo/1yr)
- [ ] Presence Points (earn by watching, spend on chat effects)
- [ ] Spark Storm system (community hype event)
- [ ] Platform-wide notification banners
- [ ] Performer Lounge (persistent community chat)

## Epic 12: Content Layer
- [ ] Performer content feed (text/photo/video)
- [ ] Subscriber-only content with blurred previews
- [ ] Individual content purchase (sparks)
- [ ] Performer Stories/Moments (24hr ephemeral)
- [ ] Content moderation queue
- [ ] DMCA takedown system

## Epic 13: Compliance & Legal
- [ ] 18 USC §2257 compliance statement on all pages
- [ ] Performer onboarding: ID upload, model release, W-9
- [ ] Yoti age verification integration (viewers)
- [ ] Cookie consent banner (GDPR/CCPA)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] DMCA procedures
- [ ] Content moderation system
