# 🎬 YouTube Downloader

NestJS-based YouTube video/audio downloader with **BullMQ** (Redis) job queue, **yt-dlp** + **FFmpeg** for streaming downloads, **Cloudflare R2** object storage with CDN distribution, **Socket.IO** real-time progress, and **Pino** structured logging.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [WebSocket Real-Time Progress](#websocket-real-time-progress)
- [Health Endpoints](#health-endpoints)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Dev Setup](#local-dev-setup)
  - [Docker Setup](#docker-setup)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Cloudflare R2 Setup](#cloudflare-r2-setup)
- [How It Works](#how-it-works)
  - [Download Flow](#download-flow)
  - [Worker Processing](#worker-processing)
  - [Caching Layer](#caching-layer)
  - [Storage & Delivery](#storage--delivery)
- [Deployment](#deployment)
  - [Docker Compose (VPS)](#docker-compose-vps)
  - [Railway / Render](#railway--render)
  - [Fly.io](#flyio)
- [Performance & Scaling](#performance--scaling)
  - [Horizontal Scaling](#horizontal-scaling)
  - [Queue Tuning](#queue-tuning)
  - [Guardrails](#guardrails)
- [Development](#development)
  - [Commands](#commands)
  - [Adding New Formats](#adding-new-formats)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌────────────────────┐
│   Client / UI      │     Next.js App, mobile app, or any HTTP client
└────────┬───────────┘
         │ HTTP + WebSocket
         ▼
┌──────────────────────────┐
│      NestJS API           │    API routes + BullMQ orchestration
│   (src/main.ts)           │    Rate-limited via @nestjs/throttler
└────────┬─────────────────┘
         │
         │  POST /api/v1/youtube/download
         │  ───────────────────────────────►  Creates BullMQ job
         ▼
┌────────────────────────┐
│     Redis Queue         │    BullMQ — persistent job queue
│     (youtube-           │    with retries, backoff, concurrency
│      downloads)         │
└────────┬───────────────┘
         │ dequeue
         ▼
┌──────────────────────────┐
│   YouTube Worker(s)       │    yt-dlp + FFmpeg processing
│   (src/workers/           │    Runs in separate process
│    youtube.worker.ts)     │
└────────┬─────────────────┘
         │ upload
         ▼
┌────────────────────────┐
│   Cloudflare R2         │    S3-compatible object storage
│   (S3-compatible)       │    Multipart upload via @aws-sdk/lib-storage
└────────┬───────────────┘
         │ serve (presigned URL or CDN)
         ▼
┌────────────────────────┐
│   Cloudflare CDN        │    Global edge distribution
│   (optional)            │
└────────────────────────┘
         │
         ▼
   User receives download link
```

### Component Roles

| Component | Role |
|-----------|------|
| **NestJS API** | Handles HTTP requests, video previews, job queuing, progress polling, rate limiting |
| **Redis** | BullMQ backend + cache (metadata, progress) |
| **BullMQ Queue** | Reliable job processing with retries, backoff, concurrency control |
| **Worker Process** | Runs yt-dlp + FFmpeg, uploads output to R2, updates job progress |
| **Cloudflare R2** | Durable object storage (S3-compatible, no egress fees) |
| **Cloudflare CDN** | Optional — serves files from edge cache for fast global delivery |
| **Socket.IO Gateway** | Real-time progress push to connected clients |

---

## Capabilities

| Requirement | Status | How |
|-------------|--------|-----|
| **🎬 Video downloads** | ✅ | Any YouTube video, any quality — `POST /api/v1/youtube/download` with `audioOnly: false` |
| **🎵 Audio only** | ✅ | Extracts MP3 @ 192kbps via FFmpeg — set `audioOnly: true` |
| **📱 YouTube Shorts** | ✅ | yt-dlp handles `youtube.com/shorts/xxx` natively — same endpoint, same flow |
| **📐 Any quality (360p → 4K)** | ✅ | Named presets: `2160p` `1440p` `1080p` `720p` `480p` `360p` + `highest` for best available + raw yt-dlp format strings for unlimited control |
| **📏 Any length** | ✅ | No duration limit. Worker uses `spawn` with no timeout — a 10-hour video downloads fully |
| **📦 Any file size** | ✅ | No size cap. R2 accepts objects up to 5TB. Worker streams → uploads → deletes local copy |
| **⚡ Async queue** | ✅ | BullMQ (Redis) — job is queued instantly, worker processes in background |
| **📊 Real-time progress** | ✅ | **Poll** `GET /api/v1/youtube/progress/:taskId` **or WebSocket** `socket.emit('subscribe', { taskId })` — push-based real-time updates |
| **🔌 WebSocket progress** | ✅ | Socket.IO on `/progress` namespace — subscribe per taskId, receive progress events |
| **☁️ Cloud storage** | ✅ | Cloudflare R2 (S3-compatible) — zero egress fees, multipart upload |
| **🌍 CDN delivery** | ✅ | Optional Cloudflare CDN edge cache for global download speeds |
| **🔒 Auto-cleanup** | ✅ | Temp files deleted after R2 upload — periodic `CleanupService` scans for orphaned files |
| **🗄️ Metadata caching** | ✅ | Redis-backed cache — `GET /preview` results cached for 1 hour (configurable) |
| **🚦 Rate limiting** | ✅ | 30 requests per 60s window per IP via `@nestjs/throttler` |
| **📝 Structured logging** | ✅ | Pino logger with pretty-print in dev, JSON in production |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20+ | Server-side JavaScript runtime |
| **Framework** | NestJS 10 | Type-safe HTTP server with decorators, DI, modules |
| **Queue** | BullMQ 5 | Redis-based job queue with priority, retries, rate limiting |
| **Redis** | Redis 7 | In-memory data store for queue + progress + cache |
| **Real-time** | Socket.IO 4 | WebSocket gateway for push-based progress updates |
| **Download Engine** | yt-dlp | YouTube video/audio extraction (supports 1000+ sites) |
| **Transcoding** | FFmpeg | Audio extraction, format conversion, thumbnail extraction |
| **Storage** | Cloudflare R2 | S3-compatible object storage (free egress) |
| **CDN** | Cloudflare CDN | Optional edge caching for downloads |
| **Validation** | class-validator + class-transformer | Request DTO validation with URL pattern matching |
| **Docs** | Swagger / OpenAPI | Auto-generated API documentation at `/docs` |
| **Rate Limiting** | @nestjs/throttler | Global rate protection (30 req/min per IP) |
| **Logging** | Pino + pino-pretty | Structured JSON logging with dev prettification |
| **Containers** | Docker + docker-compose | Reproducible deployment with health checks |

---

## Project Structure

```
youtube-downloader/
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Template with placeholders
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── Dockerfile                      # Multi-stage build (yt-dlp + ffmpeg + wget baked in)
├── docker-compose.yml              # redis + api + worker (with health checks)
├── README.md                       # ← you are here
└── src/
    ├── main.ts                     # Bootstrap: Swagger, CORS, global pipes, cleanup start
    ├── app.module.ts                # Root module — config, throttler, queue, youtube, health, gateway
    │
    ├── config/
    │   └── configuration.ts        # .env → typed config object (redis, r2, ytDlp, queue, …)
    │
    ├── youtube/
    │   ├── youtube.module.ts       # Module registration + BullMQ queue import
    │   ├── youtube.controller.ts   # HTTP endpoints (5 routes) @ /api/v1/youtube
    │   ├── youtube.service.ts      # Preview, enqueue, progress, cancel (with in-memory fallback)
    │   └── dto/
    │       ├── preview.dto.ts      # Preview request/response + FormatInfo
    │       ├── download.dto.ts     # Download request/response
    │       └── progress.dto.ts     # Progress response
    │
    ├── queue/
    │   ├── queue.module.ts         # BullMQ root config + processor registration
    │   └── youtube.processor.ts    # In-process worker: yt-dlp → upload → cleanup
    │
    ├── workers/
    │   └── youtube.worker.ts       # Standalone BullMQ worker (separate process, DI-powered)
    │
    ├── services/
    │   ├── ytdlp.service.ts        # yt-dlp preview + download (spawn-based, progress parsing)
    │   ├── upload.service.ts       # R2 multipart upload + presigned URL generation
    │   ├── cache.service.ts        # Redis cache with TTL (metadata + download results)
    │   ├── cleanup.service.ts      # Periodic temp file cleanup (15min interval)
    │   └── ffmpeg.service.ts       # FFmpeg ops: merge audio/video, convert to MP3, thumbnail
    │
    ├── gateway/
    │   ├── gateway.module.ts       # WebSocket module registration
    │   └── progress.gateway.ts     # Socket.IO gateway — /progress namespace, room-based tasks
    │
    ├── health/
    │   ├── health.module.ts        # Health module registration
    │   └── health.controller.ts    # GET /api/v1/health (system info) + GET /api/v1/healthz (liveness)
    │
    ├── storage/
    │   ├── r2.module.ts            # R2 module (legacy, superseded by UploadService)
    │   └── r2.service.ts           # R2 S3 client (legacy)
    │
    └── common/
        ├── filters/
        │   └── http-exception.filter.ts    # Global error formatting
        ├── interceptors/
        │   └── transform.interceptor.ts    # Wraps responses in { success, data, timestamp }
        └── utils/
            ├── sanitize.ts                 # Filename sanitization (path traversal prevention)
            ├── url-validator.ts            # YouTube URL validation regex + helper
            └── pino-logger.ts              # Pino-based NestJS LoggerService implementation
```

---

## API Reference

### Base URL

```
http://localhost:3000
```

All endpoints are prefixed with `/api/v1/`. Full Swagger UI at `GET /docs`.

---

### `POST /api/v1/youtube/preview`

Get video metadata *before* downloading (all formats, untruncated). Results are cached in Redis for 1 hour.

**Request body:**

```json
{
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Validation:** Only `youtube.com`, `youtu.be`, `m.youtube.com`, and `music.youtube.com` URLs are accepted.

**Response:**

```json
{
  "success": true,
  "data": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "duration": 212,
    "uploader": "Rick Astley",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "webpageUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "formats": [
      {
        "formatId": "137",
        "height": 1080,
        "ext": "mp4",
        "filesize": 18520934,
        "vcodec": "avc1.640028",
        "acodec": "none",
        "tbr": 4885.0
      }
    ]
  },
  "timestamp": "2026-06-01T17:30:00.000Z"
}
```

---

### `POST /api/v1/youtube/download`

Queue a download job. The request is validated and queued immediately.

**Request body:**

```json
{
  "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "highest",
  "audioOnly": false
}
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | `string` | — | YouTube video URL (required, validated against youtube.com/youtu.be) |
| `quality` | `string` | `"highest"` | Named preset or raw yt-dlp format selector |
| `audioOnly` | `boolean` | `false` | Extract audio as MP3 (192kbps) |

**Quality presets:** `highest`, `2160p` (4K), `1440p` (2K), `1080p`, `720p`, `480p`, `360p`  
Or pass any valid [yt-dlp format string](https://github.com/yt-dlp/yt-dlp#format-selection):

```
bestvideo[height<=1440]+bestaudio/best
bestvideo[vcodec*=avc1]+bestaudio[acodec!=opus]/best
```

**YouTube Shorts:** yt-dlp handles `https://youtube.com/shorts/xxx` URLs natively — use the same endpoint with any shorts URL. No special treatment needed.

**Any length, any size:** yt-dlp has no duration or file size limits. The worker uses `spawn` with no timeout, so a 10-hour 4K video downloads fully. R2 accepts objects up to 5TB, and the worker cleans temp files after upload.

**Response:**

```json
{
  "success": true,
  "data": {
    "taskId": "a1b2c3d4-...",
    "status": "queued",
    "source": "youtube",
    "message": "Download job queued"
  }
}
```

---

### `GET /api/v1/youtube/progress/:taskId`

Poll download progress by task UUID.

**Response:**

```json
{
  "success": true,
  "data": {
    "taskId": "a1b2c3d4-...",
    "percent": 45.2,
    "speed": "2.3MiB/s",
    "eta": "00:02",
    "filename": "Rick Astley - Never Gonna Give You Up.mp4",
    "status": "downloading",
    "errorMsg": "",
    "downloadUrl": ""
  }
}
```

**Status values:** `queued` → `downloading` → `done` | `error` | `failed`

When `status` is `"done"`, the `downloadUrl` field will contain the R2 presigned URL.

---

### `GET /api/v1/youtube/file/:taskId`

Get the download URL for a completed job.

**Response:**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://pub-XXXX.r2.dev/downloads/Rick Astley - Never Gonna Give You Up.mp4?X-Amz-Signature=..."
  }
}
```

> **Note:** The URL is time-limited (default 1 hour). Returns `404` if the file is not yet available.

---

### `DELETE /api/v1/youtube/:taskId`

Cancel a queued or running download. Removes the job from the queue.

**Response:**

```json
{
  "success": true,
  "data": { "status": "cancelled" }
}
```

---

### `GET /docs`

Swagger/OpenAPI documentation UI. Interactive endpoint testing. Also serves `GET /api/v1/health` and `GET /api/v1/healthz`.

---

## WebSocket Real-Time Progress

In addition to polling `GET /api/v1/youtube/progress/:taskId`, you can receive push-based progress updates via Socket.IO.

### Connection

```js
const io = require('socket.io-client');

const socket = io('ws://localhost:3000/progress', {
  transports: ['websocket'],   // optional — forces WS transport
});

socket.on('connect', () => console.log('connected'));
```

### Subscribe to a task

```js
socket.emit('subscribe', { taskId: 'a1b2c3d4-...' });
```

### Receive progress events

```js
socket.on('progress', (data) => {
  console.log(data);
  // { percent: 45.2, speed: '2.3MiB/s', eta: '00:02', status: 'downloading', filename: '...' }
});
```

### Unsubscribe (disconnect)

```js
socket.disconnect();
```

The gateway uses **room-based** scoping — each taskId is its own Socket.IO room, so progress events are only forwarded to clients subscribed to that specific task.

---

## Health Endpoints

### `GET /api/v1/health`

Full system health check with memory, CPU, and dependency info.

**Response:**

```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2026-06-01T17:30:00.000Z",
  "version": "1.0.0",
  "system": {
    "memory": {
      "free": 2147483648,
      "total": 8589934592,
      "usagePercent": 75
    },
    "cpu": 8,
    "platform": "linux",
    "loadAvg": [0.5, 0.3, 0.1]
  },
  "dependencies": {
    "ytDlp": "2025.12.01"
  }
}
```

### `GET /api/v1/healthz`

Kubernetes-style liveness probe (lightweight, no DB check).

```json
{ "ok": true }
```

---

## Getting Started

### Quick Start

```bash
# Terminal 1 — Start Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Install dependencies
npm install

# Start API
npm run start:dev

# Terminal 2 — Start worker
npm run start:worker
```

API → `http://localhost:3000` | Docs → `/docs` | WebSocket → `/progress`

### Prerequisites

- **Node.js** 20+ ([nvm](https://github.com/nvm-sh/nvm) recommended)
- **npm** 9+
- **Redis** 7+ (`docker run -d -p 6379:6379 redis:7-alpine`)
- **yt-dlp** (`pip install yt-dlp` or baked into the Docker image)
- **FFmpeg** (`choco install ffmpeg` on Windows, `apt install ffmpeg` on Linux, or `brew install ffmpeg` on macOS)

### Local Dev Setup

```bash
# 1. Clone and enter the project
cd youtube-downloader

# 2. Install dependencies
npm install

# 3. Start Redis (if not already running)
docker run -d -p 6379:6379 --name redis redis:7-alpine

# 4. Copy .env and fill in your values
cp .env .env.local
# Edit .env.local with your R2 credentials etc.

# 5. Start the API server (development with hot reload)
npm run start:dev

# 6. In a separate terminal, start the worker
npm run start:worker
```

The API will be available at **`http://localhost:3000`**, Swagger docs at **`http://localhost:3000/docs`**, and WebSocket at **`ws://localhost:3000/progress`**.

### Docker Setup

```bash
# Start everything (Redis + API + Worker)
docker-compose up --build

# Run in background
docker-compose up --build -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

This starts:
- **Redis** on port `6379` (internal, with health check)
- **NestJS API** on port `3000` (with health check on `/healthz`)
- **Worker** process (no exposed port, with `deploy.replicas: 1`)

All services use named volumes for data persistence (`redis_data`, `download_temp`).

---

## Configuration

### Environment Variables

All configuration is via environment variables. See [`.env`](.env) for the full template.

#### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` / `production` |
| `PORT` | `3000` | HTTP server port |
| `HOST` | `0.0.0.0` | Bind address |
| `LOG_LEVEL` | `debug` | Log verbosity (debug → info → warn → error) |

#### Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | — | Redis password |
| `REDIS_DB` | `0` | Redis database index |

#### Queue

| Variable | Default | Description |
|----------|---------|-------------|
| `DOWNLOAD_QUEUE_NAME` | `youtube-downloads` | BullMQ queue name |
| `QUEUE_CONCURRENCY` | `3` | Parallel downloads per worker process |
| `MAX_FILE_AGE_MINUTES` | `30` | Local temp file cleanup threshold |

#### yt-dlp

| Variable | Default | Description |
|----------|---------|-------------|
| `YT_DLP_COOKIES_FILE` | `cookies.txt` | Path to `cookies.txt` for restricted content |
| `YT_DLP_USER_AGENT` | `Mozilla/5.0 ...` | Custom user-agent |
| `DOWNLOAD_DIR` | `/tmp/yt-downloads` | Temp download directory |

#### Cloudflare R2

| Variable | Default | Description |
|----------|---------|-------------|
| `R2_ENDPOINT` | — | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | — | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | — | R2 API token secret |
| `R2_BUCKET_NAME` | `youtube-downloads` | R2 bucket name |
| `R2_PUBLIC_URL` | — | Optional public CDN base URL |
| `R2_PRESIGN_TTL` | `3600` | Presigned URL expiry in seconds |

#### CDN

| Variable | Default | Description |
|----------|---------|-------------|
| `CDN_BASE_URL` | — | Custom CDN domain for download URLs |

#### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_TTL` | `60` | Rate limit window in seconds |
| `RATE_LIMIT_MAX` | `30` | Max requests per window per IP |

#### Caching

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_METADATA_TTL` | `3600` | Metadata (preview) cache TTL in seconds |
| `CACHE_DOWNLOAD_TTL` | `86400` | Download result cache TTL in seconds |

---

### Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2**
2. Create a new bucket (e.g. `youtube-downloads`)
3. Go to **Manage R2 API Tokens** → **Create API Token**
   - Permission: **Object Read & Write**
   - Scope: your bucket
4. Copy the **Access Key ID** and **Secret Access Key**
5. Find your bucket endpoint in bucket **Properties** (format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)
6. Paste into `.env`:
   ```env
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET_NAME=youtube-downloads
   ```

**Optional — Public CDN URL:**

In your R2 bucket dashboard → **Settings** → **Public Access** → Connect a custom domain. Then set:

```env
R2_PUBLIC_URL=https://downloads.yourdomain.com
```

With this set, download URLs will use the public CDN domain instead of presigned tokens.

---

## How It Works

### Download Flow

```
1. User sends POST /api/v1/youtube/download
   │
2. NestJS generates a UUID (taskId) and pushes a job to BullMQ
   │
3. API immediately responds 200 { taskId, status: "queued" }
   │
4. BullMQ worker picks up the job (first free worker)
   │
5. YtdlpService spawns yt-dlp with the requested format/quality
   │
6. yt-dlp streams the download to a temp directory
   │
7. Every progress line from yt-dlp [download] 45.2%...
   → worker updates job.progress in Redis
   → optionally forwarded via Socket.IO to subscribed clients
   │
8. Client polls GET /api/v1/youtube/progress/:taskId every 1-2s
   → or receives push via WebSocket 'progress' event
   → NestJS reads progress from BullMQ (Fast path, with in-memory fallback)
   │
9. When download completes (100%):
   a. UploadService stores file to Cloudflare R2 (multipart upload)
   b. UploadService generates presigned URL (or uses CDN URL)
   c. Worker deletes local temp file
   d. Worker sets job.progress.status = "done" + downloadUrl
   │
10. Client sees status "done" with downloadUrl
    → User clicks to download
```

### End-to-End Sequence

```
Client / UI        NestJS API         BullMQ/Redis      Worker (yt-dlp)      Cloudflare R2/CDN
    │                   │                   │                    │                      │
    │  POST /download   │                   │                    │                      │
    │  {url,quality}    │                   │                    │                      │
    │──────────────────►│                   │                    │                      │
    │                   │  Queue job        │                    │                      │
    │                   │──────────────────►│                    │                      │
    │   {taskId,        │                   │                    │                      │
    │    status:queued}  │                   │                    │                      │
    │◄──────────────────│                   │                    │                      │
    │                   │                   │                    │                      │
    │  Poll /progress   │                   │                    │                      │
    │  or WS subscribe  │                   │                    │                      │
    │──────────────────►│                   │                    │                      │
    │                   │  Job state        │                    │                      │
    │                   │◄──────────────────│                    │                      │
    │   {percent:0,     │                   │                    │                      │
    │    status:queued}  │                   │                    │                      │
    │◄──────────────────│                   │  Worker picks up    │                      │
    │                   │                   │◄────────────────────│                      │
    │                   │                   │                    │                      │
    │  Poll /progress   │                   │                    │                      │
    │──────────────────►│                   │  yt-dlp --format   │                      │
    │                   │                   │  bestvideo+audio   │                      │
    │                   │                   │◄──── stream ──────│                      │
    │                   │  Progress update  │                    │                      │
    │                   │◄──────────────────│                    │                      │
    │   {percent:45,    │                   │                    │                      │
    │    speed:2.3MiB/s,│                   │                    │                      │
    │    eta:00:02}     │                   │                    │                      │
    │◄──────────────────│                   │                    │                      │
    │   (or WS push)    │                   │                    │                      │
    │                   │                   │                    │                      │
    │                   │                   │  Download done     │ Upload file          │
    │                   │                   │◄────────────────────│─────────────────────►│
    │                   │                   │                    │                      │
    │                   │  Status: done     │                    │    Presigned/CDN URL │
    │                   │◄──────────────────│                    │◄─────────────────────│
    │                   │                   │                    │                      │
    │  Poll /progress   │                   │                    │                      │
    │──────────────────►│                   │                    │                      │
    │   {percent:100,   │                   │                    │                      │
    │    status:done,   │                   │                    │                      │
    │    downloadUrl}   │                   │                    │                      │
    │◄──────────────────│                   │                    │                      │
    │                   │                   │                    │                      │
    │  GET /file/:id    │                   │                    │                      │
    │──────────────────►│                   │                    │                      │
    │   {downloadUrl}   │                   │                    │                      │
    │◄──────────────────│                   │                    │                      │
    │                   │                   │                    │                      │
    │  DOWNLOAD ─────────────────────────────────────────────────────────────────────────►│
    │  (user clicks     │                   │                    │                      │
    │   presigned URL)  │                   │                    │                      │
```

### Worker Processing

The worker can run in two forms:

| Form | File | When to use |
|------|------|-------------|
| **In-process** | `src/queue/youtube.processor.ts` | Worker inside NestJS (monolith simplicity) — uses `@Processor` decorator |
| **Standalone** | `src/workers/youtube.worker.ts` | **Recommended for production** — separate process using NestJS standalone `ApplicationContext`, shares DI-powered services |

Both use the same shared services:

- **`YtdlpService`** — spawns yt-dlp, parses progress, returns output path
- **`UploadService`** — multipart upload to R2, generates presigned URLs
- **`CleanupService`** — periodic temp file cleanup (every 15 minutes)

The standalone worker is a **separate OS process** from the NestJS HTTP server. This means:

- **No blocking**: Heavy yt-dlp/FFmpeg CPU usage won't slow down API responses
- **Independent scaling**: You can run 1 API server + 10 workers
- **Graceful failure**: If a worker crashes, the job goes back to the queue (auto-retry with exponential backoff)

### Caching Layer

`CacheService` provides Redis-backed caching to avoid redundant work:

| Cache | Key Pattern | Default TTL | Purpose |
|-------|-------------|-------------|---------|
| **Metadata** | `yt:cache:meta:<base64url(url)>` | 1 hour | Preview results — repeated lookups of the same video |
| **Download** | `yt:cache:dl:<taskId>:<quality>` | 24 hours | Download job results (URLs, metadata) |

The cache gracefully degrades: if Redis is unavailable, the service logs a warning and operates without caching.

### Storage & Delivery

Two delivery modes controlled by `R2_PUBLIC_URL`:

| Mode | `R2_PUBLIC_URL` | URL format | Expiry |
|------|-----------------|------------|--------|
| **Presigned URL** | empty | `https://<endpoint>/...?X-Amz-Signature=...` | 1 hour (configurable) |
| **Public CDN** | set | `https://cdn.yourdomain.com/downloads/file.mp4` | Permanent |

**Presigned URLs** are secure by default — only someone with the URL can download.  
**CDN URLs** are faster globally (Cloudflare edge cache) and never expire.

Uploads use `@aws-sdk/lib-storage` multipart upload (5MB parts, 4 concurrent parts) for reliable large file transfers.

---

## Deployment

### Docker Compose (VPS)

```bash
# On your VPS with Docker installed:
git clone https://github.com/your-org/youtube-downloader.git
cd youtube-downloader

# Edit .env with production values
nano .env

# Deploy
docker-compose up --build -d

# Scale workers independently
docker-compose up -d --scale worker=3

# Behind an SSL reverse proxy (Caddy / Nginx Proxy Manager / Traefik)
# Reverse-proxy http://localhost:3000 to your domain.
```

**Recommended VPS spec:** 2 vCPU, 4GB RAM (can handle 3-5 concurrent downloads).

### Railway / Render

1. Push to GitHub
2. Create two services in Railway/Render:

**Service 1 — Web (NestJS API):**
- Build: `Dockerfile`
- Start command: `node dist/main`
- Port: `3000`
- Add environment variables from `.env`

**Service 2 — Worker:**
- Build: `Dockerfile`
- Start command: `node dist/workers/youtube.worker.js`
- Add environment variables from `.env`

**Service 3 — Redis:**
- Use Railway's managed Redis or Redis Cloud (free tier: 30MB)
- Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` on both services

### Fly.io

```bash
# Install flyctl
fly launch
fly secrets set REDIS_HOST=... R2_ENDPOINT=... R2_ACCESS_KEY_ID=...
fly deploy

# Deploy worker as a separate Fly machine
fly machine run --env-file .env --command "node dist/workers/youtube.worker.js"
```

---

## Performance & Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml — scale workers independently
docker-compose up -d --scale worker=5
```

The architecture is horizontally scalable:

| Component | Scaling strategy |
|-----------|-----------------|
| **NestJS API** | Stateless — run behind a load balancer (Nginx / Traefik) |
| **Worker** | Add more worker replicas — BullMQ distributes jobs across them |
| **Redis** | Single instance is fine for most workloads; use Redis Cluster for massive scale |
| **R2 Storage** | Infinite — no scaling needed |

### Queue Tuning

Key BullMQ configuration in `queue.module.ts`:

```typescript
defaultJobOptions: {
  attempts: 3,                    // Retry three times on failure
  backoff: { type: 'exponential', delay: 5000 },  // Wait 5s, then 10s, then 20s...
  removeOnComplete: { age: 3600 },   // Keep completed jobs for 1 hour
  removeOnFail: { age: 86400 },      // Keep failed jobs for 24 hours (debugging)
}
```

Worker concurrency in `.env`:

```env
QUEUE_CONCURRENCY=3     # Per worker process
```

### Guardrails

Built-in safety measures:

| Guardrail | Implementation | Purpose |
|-----------|---------------|---------|
| **Job retries** | BullMQ `attempts: 3` | Recover from transient failures (3 attempts with backoff) |
| **Exponential backoff** | BullMQ `backoff.exponential` | Don't hammer Redis on failure |
| **Temp file cleanup** | Worker deletes after R2 upload + `CleanupService` periodic scan | No disk space leaks |
| **Queue rate limiting** | (configurable via BullMQ) | Prevent worker overload |
| **Presigned URL expiry** | Default 1 hour (configurable) | Limit exposure window |
| **Validation** | `class-validator` DTOs with URL regex | Reject malformed requests early |
| **API rate limiting** | `@nestjs/throttler` (30 req/min) | Protect API from abuse |
| **Filename sanitization** | `sanitizeFilename()` utility | Prevent path traversal / injection |
| **Graceful fallback** | In-memory progress store when Redis down | No single point of failure for progress tracking |

---

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start API with hot reload |
| `npm run start:worker` | Start standalone worker (production) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run start:prod` | Start compiled production build |
| `npm run lint` | Lint all source files |
| `npm run format` | Format with Prettier |

### Adding New Formats

Edit the format map in `src/services/ytdlp.service.ts`:

```typescript
const fmtMap: Record<string, string> = {
  highest:  'bestvideo+bestaudio/best',
  '2160p':  'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
  '1440p':  'bestvideo[height<=1440]+bestaudio/best[height<=1440]',
  '1080p':  'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
  '720p':   'bestvideo[height<=720]+bestaudio/best[height<=720]',
  '480p':   'bestvideo[height<=480]+bestaudio/best[height<=480]',
  '360p':   'bestvideo[height<=360]+bestaudio/best[height<=360]',
};
```

This map lives in `ytdlp.service.ts` and is shared by both the in-process processor and the standalone worker.

Users can also pass **raw yt-dlp format strings** (e.g. `"bestvideo[height<=1440][vcodec*=avc1]+bestaudio[acodec!=opus]/best"`) — anything that doesn't match a named preset gets passed through as-is.

### Adding Support for Other Sites

yt-dlp supports 1700+ sites (YouTube, Twitter/X, TikTok, Instagram, Reddit, etc.). To extend:

1. Add a router module (e.g. `src/tiktok/tiktok.controller.ts`)
2. Call `yt-dlp` with the URL as-is — it auto-detects the extractor
3. Reuse the same worker queue with a `source` discriminator field

---

## Troubleshooting

### Worker won't start

```bash
# Check if yt-dlp is installed
yt-dlp --version

# Check if Redis is running
redis-cli ping
# Should respond: PONG

# Check worker logs for connection errors
node dist/workers/youtube.worker.js 2>&1 | head -20
```

### Downloads stuck at "queued"

```bash
# 1. Is the worker running?
docker-compose ps worker

# 2. Check Redis connection
redis-cli ping

# 3. View queue stats
redis-cli llen bull:youtube-downloads:wait
```

### R2 upload failures

```bash
# Verify your R2 credentials (in .env)
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com  # ← correct?
R2_ACCESS_KEY_ID=...                                        # ← no spaces/typos?
R2_SECRET_ACCESS_KEY=...                                    # ← correct casing?

# Check bucket exists
# → Dashboard → R2 → Buckets → "youtube-downloads"

# Public URL not working?
# → R2 bucket → Settings → Public Access → "Connected Domain"
```

### FFmpeg errors

```bash
# Verify FFmpeg is installed
ffmpeg -version

# yt-dlp audio extraction needs FFmpeg
# Without it, audio-only mode will fail
```

### "Output file not found"

```bash
# Check the DOWNLOAD_DIR exists and is writable
ls -la /tmp/yt-downloads/

# The worker deletes files after R2 upload
# If R2 fails, the file is still cleaned up
# Set NODE_ENV=development for debug logs
```

---

## License

MIT
