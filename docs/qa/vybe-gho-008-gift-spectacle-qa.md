# VYBE-GHO-008 Gift Spectacle Smoke QA Checklist

Scope: VYBE live room gift spectacle smoke coverage for desktop and mobile.
Owner: Hermes QA support.
Mode: checklist only; no implementation edits.

## Test matrix

| Area | Desktop | Mobile |
| --- | --- | --- |
| Browsers | Chrome latest, Firefox latest, Safari/WebKit if available | iOS Safari/WebKit, Android Chrome |
| Viewports | 1440x900, 1280x720, 1024x768 | 390x844, 414x896, 360x800, landscape if supported |
| Network | normal, throttled 3G/slow 4G, reconnect after drop | normal, throttled, app background/foreground where applicable |
| Motion | default motion, reduced motion enabled | default motion, reduced motion enabled |
| User state | logged-in sender with sufficient balance, logged-in sender with low balance, receiver/viewer | same |

## Pre-flight setup

- [ ] Confirm test build, commit/branch, environment URL, API base URL, and socket endpoint are recorded.
- [ ] Confirm test accounts exist for sender, receiver/host, and passive viewer.
- [ ] Confirm sender has known starting balance and enough balance for at least one low-tier and one high-tier gift.
- [ ] Confirm a low-balance sender can be configured for negative-path balance checks.
- [ ] Open live room with at least sender, receiver/host, and passive viewer sessions.
- [ ] Enable browser DevTools console/network logging or equivalent capture.
- [ ] Prepare screenshot/video capture folder and naming convention: `YYYYMMDD-device-browser-testcase-step`.
- [ ] Confirm no production user data, secrets, tokens, or payment credentials will be captured in evidence.

## Low-tier gift effect smoke tests

- [ ] Sender can open the gift tray without visual clipping or console errors.
- [ ] Low-tier gift tiles show name, icon, price, and enabled/disabled state correctly.
- [ ] Sending a low-tier gift triggers an immediate local acknowledgement state without double-submission.
- [ ] Low-tier animation appears in the live room for sender, receiver/host, and passive viewer.
- [ ] Low-tier animation is visually lighter than high-tier effects and does not dominate the stage.
- [ ] Low-tier animation does not obscure critical controls such as close, mute, chat input, gift tray, or report/safety actions.
- [ ] Low-tier animation completes and clears without leaving orphaned particles, overlays, or stale DOM/canvas layers.
- [ ] Consecutive low-tier gifts queue or stack according to intended behavior without frame drops or text overlap.
- [ ] Rapid taps/clicks on the same low-tier gift do not create duplicate charges unless explicitly confirmed by UI.

## High-tier gift spectacle smoke tests

- [ ] High-tier gift tile clearly communicates premium/high-impact status and price before send.
- [ ] Sending a high-tier gift triggers the full spectacle effect across sender, receiver/host, and passive viewer sessions.
- [ ] High-tier animation has expected duration, scale, sound/motion behavior if applicable, and teardown timing.
- [ ] High-tier spectacle remains inside safe visual bounds on desktop and mobile viewports.
- [ ] High-tier spectacle does not cover required legal/safety controls for more than the accepted transient duration.
- [ ] High-tier effect priority is higher than low-tier effects when events occur close together.
- [ ] Multiple high-tier events queue, serialize, or replace according to product spec; no overlapping text or illegible layers.
- [ ] High-tier animation degrades gracefully on low-powered or throttled devices without freezing the live room.
- [ ] High-tier send failure path shows a clear error and does not play the success spectacle.

## Platform banner tests

- [ ] Platform banner appears for qualifying high-tier gifts on sender, receiver/host, and passive viewer views.
- [ ] Banner copy includes sender, gift, and room/host context as designed, with no placeholder values.
- [ ] Banner layout fits desktop and mobile widths without truncating important names or prices incorrectly.
- [ ] Banner does not overlap the chat composer, moderation controls, stream controls, or active spectacle text.
- [ ] Banner respects safe areas/notches on mobile.
- [ ] Banner dismisses automatically or manually according to spec.
- [ ] Multiple banners queue without stacking into unreadable layers.
- [ ] Banner click/tap behavior, if any, routes to the expected live room or profile and is keyboard accessible.

## Spark Storm tests

- [ ] Spark Storm can be triggered by the expected gift/event threshold.
- [ ] Spark Storm starts only once per qualifying event and does not retrigger endlessly on reconnect or replay.
- [ ] Spark Storm is visible to sender, receiver/host, and passive viewer sessions.
- [ ] Spark density, opacity, and color remain legible over light/dark stream backgrounds.
- [ ] Spark Storm does not hide platform banner text, gift sender text, or safety controls.
- [ ] Spark Storm stops cleanly and releases GPU/CPU resources after completion.
- [ ] Spark Storm handles reduced-motion mode by reducing, shortening, or replacing motion according to accessibility spec.
- [ ] Spark Storm remains performant during active chat and additional low-tier gift events.

## Socket event and realtime consistency tests

- [ ] Gift send emits the expected client request/event with gift ID, room ID, quantity, and idempotency/correlation identifier if defined.
- [ ] Server acknowledgement includes success/failure status, updated balance or balance delta, and event ID.
- [ ] Receiver/host and passive viewer receive the realtime gift event exactly once.
- [ ] Event ordering is stable when two users send gifts within one second.
- [ ] Duplicate socket deliveries do not duplicate animations, banners, or balance deductions.
- [ ] Reconnect after socket drop resyncs current room state without replaying expired spectacle effects.
- [ ] If socket is disconnected during send, UI shows pending/retry/failure state and avoids charging twice.
- [ ] Console contains no uncaught errors, rejected promises, or repeated reconnect loops during gift events.
- [ ] Network payloads do not expose secrets, internal stack traces, or unnecessary user PII.

## Balance and transaction tests

- [ ] Sender starting balance is visible or otherwise known before each send.
- [ ] Successful low-tier gift deducts the exact configured amount once.
- [ ] Successful high-tier gift deducts the exact configured amount once.
- [ ] Quantity/multi-send deducts exact unit price multiplied by quantity.
- [ ] Balance updates immediately in sender UI after confirmed success.
- [ ] Balance remains consistent after page refresh, room rejoin, and socket reconnect.
- [ ] Receiver/host gift totals update when applicable.
- [ ] Low-balance sender cannot send gifts above available balance.
- [ ] Failed/declined gift does not deduct balance and does not show success animation/banner.
- [ ] Rapid repeated sends cannot create negative balance, duplicate charges, or stale UI totals.

## Motion, performance, and resilience tests

- [ ] Record approximate FPS or visual smoothness during low-tier, high-tier, and Spark Storm effects.
- [ ] No visible jank, long freezes, or stream playback interruption during a single high-tier spectacle.
- [ ] CPU/GPU usage returns near baseline after effect completion.
- [ ] Memory usage does not grow continuously after repeated gift animations.
- [ ] Live room remains interactive while spectacle runs: chat, mute/unmute, close gift tray, and scroll where applicable.
- [ ] Effects respect `prefers-reduced-motion` and any in-app motion/accessibility setting.
- [ ] Animations pause, reduce, or recover gracefully when tab is backgrounded and foregrounded.
- [ ] Throttled network does not produce stuck loading spinners, indefinite pending sends, or stale banners.
- [ ] Unsupported WebGL/canvas/animation capability falls back gracefully without breaking gifting.

## Accessibility tests

- [ ] Gift tray and send controls are reachable with keyboard on desktop.
- [ ] Focus order remains logical before, during, and after gift send.
- [ ] Visible focus indicators are not hidden by animations or banners.
- [ ] Buttons and gift options have accessible names that include gift name and price.
- [ ] Screen reader announcement or live-region behavior communicates gift send success/failure without excessive repetition.
- [ ] Platform banner text meets contrast requirements over stream backgrounds or uses a readable overlay.
- [ ] Motion-heavy effects comply with reduced-motion settings.
- [ ] Touch targets on mobile are large enough and not obscured by spectacle effects.
- [ ] Error states are communicated with text, not color alone.

## Screenshot and evidence requirements

For each tested device/browser combination, capture evidence for:

- [ ] Starting live room state before gift send.
- [ ] Gift tray showing low-tier and high-tier options with prices.
- [ ] Low-tier gift animation in progress.
- [ ] High-tier gift spectacle in progress.
- [ ] Platform banner visible and readable.
- [ ] Spark Storm visible, if triggered.
- [ ] Balance before and after successful send.
- [ ] Low-balance or failure state.
- [ ] Reduced-motion behavior.
- [ ] Console/network evidence showing no critical errors.

Evidence notes:

- Use screenshots for static layout/readability checks.
- Use short screen recordings for motion/performance and overlapping-animation checks.
- Redact or avoid capturing tokens, internal IDs not needed for QA, payment details, and private user data.
- Name evidence files consistently and reference them in the final QA run notes.

## No-overlapping-text visual checks

- [ ] Gift sender name, gift name, quantity, platform banner, Spark Storm labels, and chat messages remain separately readable.
- [ ] Long usernames are truncated, wrapped, or scaled according to spec without colliding with adjacent text.
- [ ] Emoji, CJK, RTL, and long unbroken strings do not break banner or spectacle layout.
- [ ] Low-tier and high-tier effects triggered back-to-back do not render duplicate text on top of itself.
- [ ] Platform banner and in-room gift toast do not occupy the same vertical/horizontal lane unless intentionally layered with readable contrast.
- [ ] Text remains readable against bright particle effects and video backgrounds.
- [ ] Mobile safe-area and keyboard states do not push gift text into controls or off-screen.

## Negative and edge smoke tests

- [ ] Gift catalog fails to load: user sees recoverable error, retry, and no broken layout.
- [ ] Gift send API returns validation error: message is clear and no success effect plays.
- [ ] Gift send API returns 401/403: user is prompted to re-authenticate or appropriate access error appears.
- [ ] Gift send API returns 429/rate limit: UI prevents spam and communicates retry state.
- [ ] Gift send API returns 500/timeout: pending state resolves to failure and balance remains unchanged.
- [ ] Room ends during gift send: UI handles race without charge/display inconsistency.
- [ ] Sender leaves/rejoins immediately after send: balance and event history remain consistent.
- [ ] Viewer joins mid-spectacle: behavior matches spec, either no replay or current active spectacle only.

## Pass/fail exit criteria

Pass only if all critical smoke expectations below are true:

- [ ] Low-tier and high-tier gift effects render correctly on desktop and mobile.
- [ ] Platform banner and Spark Storm render only when expected and clear correctly.
- [ ] Gift socket events are delivered once and remain consistent across sender, receiver/host, and viewer.
- [ ] Balance deductions are exact, single, and durable across refresh/reconnect.
- [ ] Motion-heavy effects do not freeze or materially degrade the live room.
- [ ] Reduced-motion and basic accessibility requirements are respected.
- [ ] Evidence screenshots/recordings exist for every key state.
- [ ] No overlapping text, unreadable banner, or obscured safety/control surface remains in the smoke path.
- [ ] No critical console errors, duplicate charges, or stuck pending states are observed.

## QA run notes template

Use this section when executing the checklist later.

- Build/commit:
- Environment URL:
- API/socket endpoints:
- Desktop devices/browsers tested:
- Mobile devices/browsers tested:
- Test accounts used:
- Evidence folder:
- Result: Pass / Fail / Blocked
- Blocking findings:
- Non-blocking findings:
- Follow-up tickets:
