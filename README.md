# Runtime setup and current implementation status

## Local setup

1. Install Node.js 20+, Docker Compose, and FFmpeg (`ffmpeg -version`).
2. Start PostgreSQL, Redis, and MinIO:

   ```bash
   docker compose up -d
   ```

3. Configure local secrets and environment:

   ```bash
   cp .env.example .env.local
   openssl rand -base64 32
   ```

   Set `AUTH_SECRET` to the generated value. Configure Google OAuth only if using it. Never commit `.env.local`.

4. Install, generate, and start:

   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

5. In another terminal, run the HLS worker:

   ```bash
   npm run worker
   ```

## Implemented foundation

- Next.js App Router, TypeScript, Tailwind, PWA manifest and service-worker shell
- Credentials and optional Google auth through Auth.js, Prisma persistence, registration, and user profiles
- PostgreSQL schema for media, profiles, subscriptions, watch history, assets, and editorial audit records
- Admin media metadata endpoint, presigned MP4 upload, BullMQ enqueue/status APIs, and isolated FFmpeg worker producing HLS renditions
- Role-gated editorial transitions and a basic admin catalog dashboard
- Watch-progress persistence with profile ownership checks

## Known integration boundary

The app deliberately fails closed for playback authorization. A protected CDN/edge signer must be configured before playback URLs are returned. Do not make the MinIO/S3 bucket public and do not expose source MP4 keys or direct object URLs. The earlier TMDB credentials pasted into chat must be rotated before use.

## Validation

```bash
npm run typecheck
npm run build
curl -i http://localhost:3000/api/health
```

This repository has not been executed in this environment, so run these commands locally and inspect build/runtime output before deployment. `prisma db push` is appropriate for local setup; use committed Prisma migrations in shared or production environments.
