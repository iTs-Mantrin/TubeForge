export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'debug',

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  queue: {
    name: process.env.DOWNLOAD_QUEUE_NAME || 'youtube-downloads',
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '3', 10),
  },

  download: {
    dir: process.env.DOWNLOAD_DIR || '/tmp/yt-downloads',
    maxFileAgeMinutes: parseInt(process.env.MAX_FILE_AGE_MINUTES || '30', 10),
  },

  ytDlp: {
    cookiesFile: process.env.YT_DLP_COOKIES_FILE || '',
    userAgent:
      process.env.YT_DLP_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },

  r2: {
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || 'youtube-downloads',
    publicUrl: process.env.R2_PUBLIC_URL || '',
    presignTtl: parseInt(process.env.R2_PRESIGN_TTL || '3600', 10),
  },

  cdn: {
    baseUrl: process.env.CDN_BASE_URL || '',
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  },

  cache: {
    metadataTtl: parseInt(process.env.CACHE_METADATA_TTL || '3600', 10),
    downloadTtl: parseInt(process.env.CACHE_DOWNLOAD_TTL || '86400', 10),
  },
});
