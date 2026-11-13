# QuatuBe Streaming Platform

QuatuBe is a production-ready video-on-demand platform architecture and starter implementation inspired by modern Netflix-style streaming products. It includes authentication, media ingestion, HLS transcoding, adaptive video playback, admin content management, billing entitlements, and security hardening.

This repository captures the full project design and implementation path from initial scaffolding through production-grade architecture.

## 1. Platform Vision

QuatuBe is designed to support:
- User sign-up, login, profiles, and session management
- Secure playback authorization and entitlement checks
- Multi-bitrate HLS video streaming
- Responsive modern UI with Netflix-like browsing patterns
- Watch history, recommendations, and search
- Admin CMS for media publishing workflows
- Secure subscriptions and billing integration
- Risk-aware security with MFA, passkeys, and suspicious activity tracking

## 2. Recommended Tech Stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- hls.js for adaptive video playback
- PWA support with web manifest and service worker

### Backend
- Next.js API routes / server actions
- Prisma ORM
- PostgreSQL
- Redis + BullMQ

### Video Pipeline
- FFmpeg workers
- S3-compatible object storage (AWS S3, Cloudflare R2, MinIO)
- HLS master playlists and segment generation
- Signed URLs and CDN protection

### Security & Identity
- NextAuth v5
- Email/password + Google OAuth
- TOTP MFA
- WebAuthn / passkeys
- Device session management and revocation
- JWT-based playback grants

### Monetization
- Stripe subscriptions
- Plan entitlements
- Billing webhook sync

## 3. System Architecture

QuatuBe is built as a layered platform:

1. Client app layer
   - Browser UI
   - Installable PWA experience
   - Watch pages and catalog pages
   - Player with adaptive HLS playback

2. Auth and API layer
   - Session creation and validation
   - Subscription checks
   - Playback authorization
   - Device and profile enforcement

3. Media processing layer
   - Upload to object storage
   - Queue-driven FFmpeg transcode jobs
   - Multi-bitrate HLS output
   - Asset validation and readiness checks

4. Data layer
   - PostgreSQL for users, media, profiles, subscriptions, and watch history
   - Redis for queue coordination and playback lease tracking

5. Delivery layer
   - Object store for raw and processed files
   - CDN in front of HLS manifests and segments
   - Signed URLs / cookies for private playback

## 4. High-Level Feature Modules

### Module A: Project Setup, Database Schema & Authentication

Included features:
- Prisma schema design
- User + profile models
- Secure auth flow
- Google OAuth integration
- Route protection and session management

### Module B: MP4 Upload & Automated FFmpeg HLS Transcoding Worker

Included features:
- Secure upload URL generation
- Redundant queue-based processing with BullMQ
- FFmpeg transcode worker
- Multi-bitrate HLS output
- Status tracking for assets

### Module C: Netflix-Style UI & Adaptive HLS Video Player

Included features:
- Hero banner layouts
- Category rows
- Continue Watching UI
- Installable PWA app shell
- hls.js-based player
- PiP and keyboard controls

### Module D: Watch History, Search, Subtitles & Recommendations

Included features:
- Resume-watching progress saving
- Search API and frontend bar
- Subtitle integration
- Recommendation generation based on user history and genre affinity

### Module E: Security Hardening

Included features:
- MFA with TOTP
- WebAuthn passkeys
- Device session tracking and revocation
- Risk-based sign-in monitoring
- Playback entitlements and concurrency limits

### Module F: Enterprise Identity & Billing

Included features:
- Google / Okta / Microsoft SSO patterns
- Organization membership mapping
- Stripe checkout and subscription sync
- Premium plan enforcement
- Admin permissioning

### Module G: Editorial Workflow & Quality Validation

Included features:
- Draft / In Review / Approved / Published workflow
- Admin CMS and review queue
- Asset quality gate before publication
- Technical validations for stream readiness

## 5. Core Database Concepts

The recommended PostgreSQL model includes the following domain objects:

- users
- profiles
- subscriptions
- devices
- watch_history
- media
- media_assets
- subtitles
- recommendations
- login_attempts
- login_events
- play_sessions
- organizations
- organization_members
- authenticators
- media_review_actions

## 6. Authentication & Playback Flow

A typical secure flow looks like this:

1. User signs in with password, Google OAuth, or passkey.
2. App binds the active profile and session.
3. User navigates to a protected watch page.
4. Backend verifies subscription, device, profile, and media readiness.
5. API issues a short-lived playback token or secure cookie.
6. CDN/edge validates the grant before serving `.m3u8` and media segments.
7. Player loads the manifest and adapts on broadcast / network quality.
8. Watch progress is saved periodically by the client and server.

## 7. FFmpeg Example for HLS Transcoding

```bash
ffmpeg -y \
  -i input.mp4 \
  -vf scale=-2:1080 \
  -c:v libx264 \
  -preset fast \
  -crf 22 \
  -g 48 \
  -sc_threshold 0 \
  -b:v 4500k \
  -maxrate 5400k \
  -bufsize 8000k \
  -pix_fmt yuv420p \
  -c:a aac \
  -ar 48000 \
  -f hls \
  -hls_time 6 \
  -hls_playlist_type vod \
  -hls_segment_filename output/1080p/1080p_%03d.ts \
  output/1080p/1080p.m3u8
```

This pattern is repeated for lower variants such as 720p, 480p, and 360p.

## 8. Recommended Environment Variables

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streamverse?schema=public"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="minioadmin"
AWS_ENDPOINT="http://localhost:9000"
AWS_BUCKET="streamverse"
AWS_PUBLIC_BASE_URL="http://localhost:9000/streamverse"
PLAYBACK_TOKEN_SECRET="replace-with-a-32-byte-plus-secret"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TMDB_API_KEY=""
TMDB_ACCESS_TOKEN=""
```

## 9. Local Development Setup

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Optional local media stack:

```bash
docker compose up -d
```

This provides Redis and MinIO for queue and object storage testing.

## 10. Production Deployment Guidance

Recommended production architecture:
- Web app: Next.js app served behind CDN or Kubernetes / Docker runtime
- Worker tier: separate FFmpeg worker containers
- Database: managed PostgreSQL
- Cache / queue: managed Redis
- Storage: S3 or Cloudflare R2
- CDN: CloudFront / Cloudflare
- Monitoring: Sentry + OpenTelemetry + log aggregation
- Secrets: environment manager / Secret Store

## 11. Security Notes

- Rotate exposed API keys and secrets immediately.
- Never expose private media URLs publicly.
- Always use signed URLs or signed cookies for HLS playback.
- Use short-lived playback grants.
- Lock down admin routes by role and database-backed checks.
- Protect media segments, child playlists, and manifest routes.
- Require MFA or passkeys for premium/admin accounts.
- Record sign-in and device events for risk analysis.

## 12. Project Roadmap

1. Core authentication and database foundation
2. Secure media upload and HLS transcode pipeline
3. Netflix-like UI and adaptive video playback
4. Watch history, search, subtitles, and recommendations
5. Authentication security hardening (MFA and passkeys)
6. Device/session enforcement and playback rights
7. Stripe billing and premium subscriptions
8. Admin content management and quality validation
9. Enterprise SSO and org-level licensing
10. Production deployment and monitoring

## 13. Security Reminder

If you use the example API keys from earlier in this process, rotate them before committing any real credentials into source control. Treat all credentials as compromised if they were pasted into chats or screenshots.

## 14. Conclusion

QuatuBe is designed as a full-stack, production-conscious streaming platform architecture that can be implemented incrementally. It is intended to support a modern VOD product with strong UX, secure playback, scalable media processing, and enterprise-grade identity controls.

This README is a foundational architecture reference for the repository and can be expanded into a real implementation as the project moves forward.

---

This repository is now a design-and-implementation reference for the streaming platform. Use the architecture, modules, and examples above as the foundation for the actual application code in the project directory.
