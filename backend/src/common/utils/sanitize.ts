/**
 * Sanitize a filename to prevent path traversal, unicode issues,
 * and other filesystem hazards.
 *
 * - Strips directory separators and path components
 * - Replaces reserved characters with underscores
 * - Limits length to 200 bytes (URL-safe)
 */
export function sanitizeFilename(name: string): string {
  return (
    name
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove directory traversal
      .replace(/\.\./g, '')
      .replace(/[/\\:?*"<>|]/g, '_')
      // Collapse repeated underscores/spaces
      .replace(/[_ ]+/g, '_')
      .replace(/^_+|_+$/g, '')
      // Limit length — yt-dlp titles can be very long
      .slice(0, 200)
      // Fallback for empty result
      .trim() || 'download'
  );
}

/**
 * Build a safe output template for yt-dlp.
 * Uses a sanitized prefix so the resulting file paths are safe.
 */
export function buildOutputTemplate(
  downloadDir: string,
  taskId: string,
): string {
  return `${downloadDir}/yt_${taskId}_%(title)s.%(ext)s`;
}
