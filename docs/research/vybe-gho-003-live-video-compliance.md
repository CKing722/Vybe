# VYBE-GHO-003 Research: Live Video, Verification, Payment, Compliance

Date: 2026-05-24 UTC
Owner: Hermes
Scope: Research/support only. No VYBE implementation files were edited. This is not legal advice; route final compliance positions through qualified counsel and processor/vendor underwriting.

## Executive recommendation

For an adult-oriented live/social video platform, use a split architecture:

1. Live interactive sessions: favor LiveKit for creator/viewer rooms, low-latency WebRTC, token-gated room access, realtime moderation hooks, and future agent/AI features.
2. Broadcast/VOD/archive delivery: favor Cloudflare Stream for managed live ingest, transcoding, HLS/DASH playback, global delivery, and replay recordings where sub-second interactivity is not required.
3. Age assurance: integrate Yoti or equivalent as a pre-access age gate for viewers and a stricter creator onboarding step; store only pass/fail, method, timestamp, jurisdiction, and vendor reference unless counsel requires more.
4. Payments: treat CCBill/adult underwriting as a gating dependency before launch; align content policy, MCC, chargeback workflow, disclosures, refunds/cancellations, and prohibited-content controls before processing live traffic.
5. Compliance: implement 18+ access controls, performer/creator onboarding, consent and content rights, moderation, 2257/2257A records workflow, DMCA agent/notice-and-takedown, repeat-infringer termination, sanctions/fraud controls, and privacy/security controls before public beta.

## 1. Live video: LiveKit vs Cloudflare Stream

### LiveKit fit

LiveKit is a realtime WebRTC platform. Its docs position it as a platform for voice/video/AI agents and provide SDKs/APIs for realtime rooms and deployment/management. LiveKit can be run locally/self-hosted with `livekit-server --dev`, and the platform also offers cloud-managed deployment paths. This makes it a better fit for interactive use cases: creator rooms, multi-party video, private shows, voice/video chat, backstage moderation, and event-driven enforcement.

Key VYBE implications:

- Strengths:
  - WebRTC rooms support low-latency interaction better than HTTP live streaming.
  - Tokenized room joins can be tied to VYBE auth, age-verification state, subscriptions, and moderation bans.
  - Self-hosting option gives more control over data residency, logs, network egress, and audit evidence.
  - Operationally extensible for real-time moderation workflows: participant webhooks, room lifecycle events, recording/egress pipelines, and agent-assisted trust/safety.
- Risks/costs:
  - Requires operating TURN/STUN, media servers, scaling, observability, incident response, and abuse controls if self-hosted.
  - Adult traffic can create unpredictable bandwidth and abuse spikes.
  - Recording/archival and CDN distribution need additional design; do not rely on raw WebRTC as the only media delivery layer for VOD.
- Best use in VYBE:
  - Live interactive rooms and creator broadcast control plane.
  - Private 1:1 or small-group sessions.
  - Moderator join/listen/terminate workflows.
  - Ephemeral rooms where access decisions must be enforced in real time.

### Cloudflare Stream fit

Cloudflare Stream is a managed service for uploading, storing, encoding, and delivering live and on-demand video with one API, without maintaining video infrastructure. For live video, Cloudflare Stream creates a live input with a stream key; creators broadcast via RTMPS or SRT; Cloudflare encodes to multiple resolutions and delivers through Cloudflare's network. Playback can use the Cloudflare Stream Player or any HLS/DASH-compatible player. Stream also supports transition from live playback to recordings, with recordings available shortly after the live stream ends.

Key VYBE implications:

- Strengths:
  - Managed live ingest, encoding, storage, delivery, and global playback.
  - HLS/DASH compatibility simplifies web/mobile playback and scale.
  - Good fit for creator-to-many broadcast, clips, previews, archives, trailers, and post-live replays.
  - Reduces media infrastructure burden versus operating a full transcoding/CDN stack.
- Risks/costs:
  - HLS/DASH latency and interaction model are not equivalent to WebRTC rooms.
  - Stream keys and live inputs need strict creator authorization and rotation controls.
  - Must confirm adult-content acceptability, service-specific restrictions, and enforcement paths during vendor onboarding. Cloudflare terms prohibit illegal content and reserve enforcement rights; adult compliance posture should be explicitly documented before launch.
  - Moderation interventions may not be as immediate as terminating a WebRTC room unless integrated with live input controls and player/API enforcement.
- Best use in VYBE:
  - One-to-many broadcasts where ultra-low latency is not a hard requirement.
  - VOD library, previews, replays, and content distribution.
  - Delivery layer behind VYBE entitlement checks and signed/controlled playback URLs.

### Decision matrix

| Requirement | LiveKit | Cloudflare Stream | Recommendation |
|---|---:|---:|---|
| Low-latency interaction | High | Medium/low | LiveKit |
| Multi-party rooms | High | Low | LiveKit |
| Managed transcoding/CDN/VOD | Medium, requires add-ons/design | High | Cloudflare Stream |
| Operational control/self-host | High | Low/medium | LiveKit where control is required |
| Fast launch of broadcast/VOD | Medium | High | Cloudflare Stream |
| Moderation termination in-session | High if integrated with room control | Medium if integrated with live input/player controls | LiveKit for interactive; Stream for broadcast with API kill-switch |
| Adult compliance evidence | Platform-implemented | Platform + vendor terms | VYBE must own compliance layer either way |

Recommended pattern: LiveKit for live rooms, Cloudflare Stream for broadcast archives/VOD. Avoid a single-provider assumption until adult-content acceptance, cost, latency, recording, deletion, and data-retention requirements are verified with each vendor.

## 2. Yoti viewer and creator age-verification notes

Yoti markets age verification as privacy-first age checks that share the result of the age check with the business, not unnecessary user data. Its age-verification options include selfie/facial age estimation, mobile, credit card, electronic ID, SSN/name/DOB checks, Digital ID, and document methods. Yoti's adult-content age verification page specifically targets age-restricted content and describes over/under age-threshold results, deletion of data for privacy, low-friction checks, and a single API integration. Yoti also states that facial age estimation uses a selfie, liveness detection, and anti-spoofing/injection controls, and can return results via API or age verification platform.

Recommended VYBE integration posture:

- Viewer access gate:
  - Require age assurance before any adult-content browse, preview, live room join, purchase, chat, upload, or profile follow.
  - Store minimal state: `age_verified=true`, threshold passed, method class, jurisdiction, vendor transaction/session ID, timestamp, expiry, and policy version. Avoid storing biometric images or identity documents unless there is a counsel-approved reason.
  - Use step-up verification for risk events: high-risk jurisdiction, payment disputes, suspicious behavior, account takeover signals, creator application, or moderation reports.
- Creator onboarding:
  - Use stronger identity and age verification than viewer-only flows: government ID + selfie/liveness + tax/payment/KYC alignment where applicable.
  - Capture contractual consent, stage name/legal name mapping, payout identity, content-rights attestation, and 2257/2257A records responsibilities.
- Jurisdiction controls:
  - Implement jurisdiction-aware thresholds and fallback flows. Some markets require specific methods, higher thresholds, local provider participation, or explicit privacy constraints.
  - Maintain a policy engine so legal/compliance can change allowed methods per geography without code rewrites.
- Privacy/security:
  - Treat age assurance as high-risk personal data processing. Apply data minimization, vendor DPA review, retention limits, encryption, access logging, deletion workflow, and privacy notice coverage.
  - Do not expose verification method or age status publicly; only use it for authorization decisions and compliance audit evidence.

Open Yoti due-diligence questions:

1. Which Yoti products are available in all VYBE launch jurisdictions, and which require local partner flows?
2. What exact response fields and retention options are available for the selected API/product?
3. Can Yoti provide processor/subprocessor lists, DPA, SOC/security documentation, and biometric/privacy disclosures required for adult-content use?
4. What SLA and fallback flow applies when Yoti verification fails, is unavailable, or produces an edge-case estimate?
5. Does Yoti contractually allow use for adult-content platforms in the target launch jurisdictions?

## 3. CCBill adult payment requirements and operational impacts

CCBill positions itself as an adult merchant account and payment processing provider with adult MCC support, regulatory/content compliance support, risk mitigation, fraud specialists, chargeback/retrieval reduction, 24x7 buyer support, and PCI DSS compliant payment platform/gateway options. Its Merchant Acceptable Use Policy reserves the right to reject sites and prohibits content/activity that violates local, state, U.S., or international law or regulation; infringement of copyright/trademark/right-of-publicity/patent/statutory/common-law/proprietary rights; obscene/libelous/threatening content; misleading consumers about content or pricing; unauthorized access; and other illegal/network-abusive conduct.

VYBE launch implications:

- Processor underwriting must be completed before enabling monetization. Do not assume generic Stripe/PayPal-style flows are viable for adult content.
- CCBill/adult acquiring will likely require review of:
  - Business model, URLs, ownership, beneficial owners, bank account, tax information, and projected volumes.
  - Full content policy, moderation policy, creator onboarding, age verification, DMCA process, refund/cancellation policy, recurring billing disclosures, privacy policy, terms of service, and prohibited content list.
  - Chargeback handling, fraud controls, customer support process, and descriptor/disclosure clarity.
  - Evidence that minors, non-consensual content, CSAM, trafficking, coercion, revenge porn, copyright infringement, and illegal content are actively prevented and remediated.
- Payment controls to implement:
  - Explicit recurring billing consent and cancellation path before charge.
  - Transaction logging tied to verified user/account state, not only email/browser session.
  - Refund and dispute workflow with evidence preservation.
  - Velocity controls for card testing, account takeover, gift/subscription abuse, and creator payout fraud.
  - Separation of payout eligibility from viewer payment status; no creator payout until onboarding, sanctions/KYC, tax, and content compliance checks pass.

Open CCBill due-diligence questions:

1. Exact prohibited adult-content categories and documentation required for live creator platforms.
2. Whether live-streaming, user-generated adult content, creator messaging, tips, and subscriptions are supported under the intended MCC and geography.
3. Required on-site disclosures, billing descriptor, refund/cancellation wording, and chargeback thresholds.
4. Whether CCBill requires prior approval of Yoti/age-verification flow and moderation workflow.
5. Required audit/evidence retention and reporting for disputed transactions and prohibited-content incidents.

## 4. 2257 / moderation / DMCA checklist

### 2257 / 2257A recordkeeping checklist

U.S. federal 18 U.S.C. 2257/2257A and 28 CFR Part 75 impose recordkeeping obligations for producers of certain sexually explicit visual depictions. 28 CFR Part 75 defines producers, primary producers, and secondary producers, requires records tied to performer identification, allows hard-copy or digital records if scanned ID copies are included and a custodian can authenticate digital records, and requires statements describing where required books and records are located. Applicability can be fact-specific, especially for platforms hosting third-party/user-generated content, live streams, clips, replays, and creator-uploaded media.

VYBE should implement before launch:

- Counsel-owned applicability memo for VYBE's exact model: platform, creators, live streams, stored VOD, clips, previews, DMs, and user uploads.
- Creator/performer onboarding workflow:
  - Legal name, DOB, government ID, selfie/liveness, payout identity, tax/KYC, sanctions screening where applicable.
  - Performer release and consent contract per performer/content item/session.
  - Representation that all performers are 18+ and voluntarily participating.
  - Re-verification and contract update process for expired IDs, account changes, and co-performer additions.
- Records workflow:
  - Per-content/session mapping from content ID/session ID to verified performers and records location.
  - Custodian of records designation and statement displayed/maintained as counsel directs.
  - Immutable audit log of creation, modification, deletion, takedown, restoration, and custodian access.
  - Encryption at rest, strict role-based access, dual-control export, and retention schedule.
- Live-specific controls:
  - Prohibit unverified co-performers from appearing on stream.
  - Moderator escalation when a new/unverified person appears.
  - Session interruption/termination controls and post-incident evidence preservation.
  - Retain sufficient metadata/recording policy to support compliance and disputes, while balancing privacy and deletion obligations.

Open legal questions:

1. Whether VYBE is a primary producer, secondary producer, both, neither for some flows, or within exemptions for any content classes.
2. How 2257 obligations apply to ephemeral live streams, private shows, co-performers, guest appearances, and AI-generated/synthetic content.
3. Which exact records must be retained by VYBE versus creators, and what contractual warranties/indemnities are enforceable.
4. What public 2257 statement wording/location is required for each VYBE surface.
5. Retention/deletion conflicts between 2257, privacy law, processor requirements, litigation holds, and user deletion requests.

### Moderation and trust/safety checklist

Minimum launch gates:

- Prohibited content policy covering CSAM, minors/age ambiguity, non-consensual intimate imagery, coercion/trafficking, violence, bestiality, incest where prohibited, intoxication/incapacity, revenge porn, doxxing, harassment, copyrighted content, illegal goods/services, and jurisdiction-specific prohibited categories.
- Creator and viewer terms requiring 18+, lawful content, consent, rights ownership, no recording/rebroadcasting where prohibited, and cooperation with compliance requests.
- Pre-publication and live moderation:
  - Automated hash/image/video/text screening where feasible.
  - Human moderation queue for flagged uploads, reports, new creators, high-risk categories, and live incidents.
  - Live kill-switch: terminate room/input, revoke tokens, freeze account, preserve evidence, and trigger incident workflow.
  - Repeated-report scoring and trust-tiering for creators/viewers.
- Reporting and appeals:
  - In-product report flows for illegal content, non-consensual content, underage content, copyright, harassment, fraud, and payment abuse.
  - Emergency escalation path for apparent CSAM, trafficking, or credible harm.
  - Documented appeals/restoration process that does not restore legally risky content without review.
- Evidence and audit:
  - Case management IDs, timestamps, actor IDs, moderator actions, policy version, rationale, evidence references, and final disposition.
  - Law-enforcement preservation workflow and counsel review triggers.
  - Metrics: time-to-takedown, repeat violators, age-gate failures, chargeback rate, report volume, moderator SLA.

### DMCA / copyright checklist

The U.S. Copyright Office's Section 512 resources describe the DMCA safe harbor and notice-and-takedown system. Effective notices include, among other elements, a signature of the owner/agent, identification of copyrighted works, identification of infringing material and information sufficient to locate it, contact information, good-faith statement, and accuracy/authority statement. To maintain safe harbor, online service providers must adopt and reasonably implement a repeat-infringer termination policy.

VYBE should implement:

- Register and maintain a DMCA designated agent with the U.S. Copyright Office if seeking U.S. Section 512 safe-harbor coverage.
- Public DMCA policy and notice intake address/form.
- Notice validation, takedown, creator notification, counter-notice, restoration, and repeat-infringer workflow.
- Copyright ownership attestation at upload/go-live, including music/background media and promotional assets.
- Hash/fingerprint reuse controls for removed infringing works where feasible.
- Repeat-infringer policy in Terms of Service and operational account enforcement.
- Audit log for notices/counter-notices and all content state changes.

## 5. Risk register

| Risk | Severity | Why it matters | Initial mitigation |
|---|---:|---|---|
| Underage access or performer appearance | Critical | Criminal, civil, processor, vendor, reputational exposure | Mandatory age gate, creator KYC, live moderation, session kill-switch, incident escalation |
| 2257/records non-compliance | Critical | Adult-content recordkeeping failures can create legal exposure | Counsel memo, records system, custodian workflow, content/session mapping |
| Processor rejection or termination | High | No monetization; funds holds; chargeback exposure | CCBill underwriting before launch, policy pack, fraud/chargeback controls |
| Vendor adult-content restriction mismatch | High | Cloud/live/video vendors may restrict or enforce against certain content | Written vendor confirmation, backup provider design, terms review |
| Non-consensual or illegal content | Critical | Severe harm and legal exposure | Prohibited-content policy, creator contracts, reports, moderation, evidence preservation |
| DMCA repeat-infringer failure | High | Loss of safe harbor, infringement liability | Designated agent, takedown workflow, repeat-infringer policy |
| Privacy/biometric data mishandling | High | Age verification can involve sensitive/biometric data | Data minimization, vendor DPA, no image retention by VYBE unless required, encryption/access logs |
| Live moderation latency | High | Harm can occur before asynchronous review | Real-time controls, staffed moderation, automated alerts, room/input termination APIs |
| Jurisdiction drift | High | Age assurance/adult-content/payment rules vary and change | Policy engine, launch geofencing, legal watchlist, jurisdiction matrix |
| Chargeback/fraud/card testing | Medium/high | Processor risk and revenue loss | Velocity rules, device/IP risk, 3DS where available, CCBill dispute workflow |
| Recording/retention conflict | Medium/high | Compliance/evidence vs privacy/deletion tension | Counsel-approved retention schedule and legal hold process |

## 6. Open launch-blocking questions

1. What jurisdictions are in-scope for launch, and will VYBE geofence unsupported states/countries until legal review is complete?
2. Is VYBE hosting explicit adult content, implied adult content, live-only content, stored VOD, DMs, paid private shows, tips, subscriptions, or all of the above?
3. Will VYBE be a producer/secondary producer under 2257/2257A for any content class, and who is the custodian of records?
4. Does Cloudflare Stream contractually permit the intended adult-content categories and business model?
5. Does LiveKit Cloud, if used, permit the intended adult-content categories, or should VYBE self-host LiveKit for compliance/control?
6. Which Yoti product/methods satisfy all target jurisdictions, and what fallback is acceptable when automated estimation is inconclusive?
7. What exact CCBill underwriting package is required, and what site/policy changes are mandatory before approval?
8. What evidence must be retained for moderation, payments, DMCA, 2257, and age verification, and for how long?
9. What is the operational staffing model for 24/7 live moderation, escalations, takedowns, and law-enforcement/counsel notifications?
10. How will VYBE handle AI-generated, deepfake, synthetic, or edited content, including consent and likeness rights?

## 7. Source notes

- LiveKit documentation overview, describing LiveKit as a platform for voice/video/AI agents and SDK/API/deployment documentation: https://docs.livekit.io/intro/overview/
- LiveKit local/self-hosting documentation, including local server install and `livekit-server --dev`: https://docs.livekit.io/transport/self-hosting/local/
- Cloudflare Stream overview, describing serverless live/on-demand video upload, storage, encoding, and delivery with one API: https://developers.cloudflare.com/stream/
- Cloudflare Stream live video documentation, including RTMPS/SRT ingest, multi-resolution encoding, HLS/DASH playback, and recordings after streams end: https://developers.cloudflare.com/stream/stream-live/
- Cloudflare Stream custom player documentation, stating HLS/DASH compatibility: https://developers.cloudflare.com/stream/viewing-videos/using-own-player/
- Cloudflare Self-Serve Subscription Agreement, acceptable-use restrictions including illegal content and intellectual-property infringement: https://www.cloudflare.com/terms/
- Yoti age verification page, privacy-first age checks and available methods: https://www.yoti.com/business/age-verification/
- Yoti facial age estimation page, selfie/liveness/API result claims and deletion/privacy statements: https://www.yoti.com/business/facial-age-estimation/
- Yoti adult-content age verification page, adult age assurance options and threshold/pass-result positioning: https://www.yoti.com/adult-content-age-verification/
- CCBill adult merchant account/adult payment processing page, adult MCC/regulatory/compliance/risk support positioning: https://ccbill.com/industries/adult-business
- CCBill Merchant Acceptable Use Policy, prohibited/illegal/infringing/misleading/network-abusive activity restrictions: https://ccbill.com/cs/client/policies/ccbill/acceptable_use.html
- 28 CFR Part 75 eCFR API, recordkeeping and record-inspection provisions for 18 U.S.C. 2257/2257A: https://www.ecfr.gov/api/versioner/v1/full/2026-05-21/title-28.xml?part=75
- U.S. Copyright Office Section 512 resources, DMCA safe harbors, notice-and-takedown, designated agent and repeat-infringer context: https://www.copyright.gov/512/
- FTC COPPA FAQ, under-13/actual-knowledge and parental-consent baseline for child-directed or child-user data collection: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
