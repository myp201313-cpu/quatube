# QuatuBe development setup

## Requirements

- Node.js 20+
- Docker Compose
- FFmpeg installed locally (`ffmpeg -version`)

## Start local dependencies

```bash
docker compose up -d
cp .env.example .env.local
# Set AUTH_SECRET to a fresh secret before starting the app.
```

Generate a secret with:

```bash
openssl rand -base64 32
```

## Install and initialize

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

In another terminal, start the background transcoding worker:

```bash
npm run worker
```

The app is available at http://localhost:3000. Create an account at `/register`, then sign in at `/login`. To try Google OAuth, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.

## Admin upload and transcode API

Promote a local test user to ADMIN using Prisma Studio (`npx prisma studio`) or a controlled SQL operation. Do not expose public admin self-registration.

1. Create a draft media record:

```bash
curl -X POST http://localhost:3000/api/admin/media \
  -H 'Content-Type: application/json' \
  -b 'your-auth-cookie' \
  -d '{"title":"Sample Film","slug":"sample-film","synopsis":"A demo title","releaseYear":2025,"genres":["Drama"]}'
```

2. Request an upload URL at `POST /api/admin/media/{mediaId}/upload-url` with JSON `{"fileName":"sample.mp4","contentType":"video/mp4"}`. Upload the file with an HTTP `PUT` to the returned `uploadUrl`.
3. Call `POST /api/admin/media/{mediaId}/transcode` to enqueue work. Check `GET /api/admin/media/{mediaId}/status` and worker logs.

The worker generates HLS renditions and stores them in the private MinIO bucket. Playback authorization/CDN edge validation is intentionally not exposed by this starter yet: do not make the bucket public or use the stored object key as a client URL. Protect every manifest and segment at the CDN before enabling production playback.

## Security notes

- Never commit `.env.local` or real API credentials.
- The TMDB credentials pasted in the original conversation must be rotated before use.
- Registration currently creates consumer accounts; admin/editor roles must be assigned through a trusted operator path.
- Use Prisma migrations for deployed environments; `db push` is for local prototyping only.
- Local MinIO credentials and PostgreSQL passwords are development-only.
