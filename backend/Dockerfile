# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install build deps (ffmpeg for yt-dlp)
# nodejs/npm from base image; yt-dlp[default] includes yt-dlp-ejs
RUN apk add --no-cache ffmpeg python3 py3-pip && \
    pip3 install --break-system-packages -U "yt-dlp[default]"

COPY . .
RUN npm ci

COPY src/ ./src/
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

# Runtime deps (nodejs/npm from base image)
RUN apk add --no-cache ffmpeg python3 py3-pip wget && \
    pip3 install --break-system-packages -U "yt-dlp[default]"

# Add yt-dlp auto-update cron (runs daily at 3am)
RUN echo "0 3 * * * yt-dlp -U >> /var/log/ytdlp-update.log 2>&1" > /etc/crontabs/root

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider http://localhost:3000/healthz || exit 1

# Default: API server. Override CMD for worker (node dist/workers/youtube.worker.js)
CMD ["node", "dist/main"]
