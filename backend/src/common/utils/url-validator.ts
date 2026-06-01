/**
 * YouTube URL validation utilities.
 *
 * Only allow known YouTube domains to prevent SSRF / open-redirect attacks
 * on the yt-dlp subprocess.
 */

const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
  'www.youtu.be',
];

const YOUTUBE_REGEX = new RegExp(
  `^https?://(${YOUTUBE_DOMAINS.map((d) =>
    d.replace(/\./g, '\\.'),
  ).join('|')})/`,
);

/**
 * Strict check: only known YouTube domains, must be http(s).
 */
export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

/** Pre-compiled pattern for use with class-validator `@Matches()` */
export const YOUTUBE_URL_PATTERN = YOUTUBE_REGEX.source
  // Wrap in ^ $ for full-string match
  .replace(/^\^/, '')
  .replace(/\$$/, '');
