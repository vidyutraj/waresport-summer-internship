/**
 * Discriminated union representing how a resource URL should be embedded.
 */
export type EmbedStrategy =
  | { type: "youtube"; embedUrl: string }
  | { type: "google-docs"; embedUrl: string }
  | { type: "iframe"; url: string }
  | { type: "fallback" };

/**
 * Pure function that maps a resource URL to an embed strategy.
 *
 * Detection rules:
 * - YouTube: `youtube.com/watch?v=` or `youtu.be/{id}` → returns youtube embed URL
 * - Google Docs/Drive: `docs.google.com` or `drive.google.com` → returns preview URL
 * - Any other valid URL → returns iframe strategy
 * - Malformed URL → returns fallback
 */
export function getEmbedStrategy(url: string): EmbedStrategy {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { type: "fallback" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // YouTube detection
  if (hostname === "www.youtube.com" || hostname === "youtube.com") {
    const videoId = parsed.searchParams.get("v");
    if (videoId) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  if (hostname === "youtu.be") {
    // pathname is "/{videoId}"
    const videoId = parsed.pathname.slice(1).split("/")[0];
    if (videoId) {
      return {
        type: "youtube",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  // Google Docs / Drive detection
  if (hostname === "docs.google.com" || hostname === "drive.google.com") {
    let embedUrl = url;

    // Strip trailing slash for consistent processing
    const pathWithoutTrailingSlash = parsed.pathname.replace(/\/$/, "");

    // If the URL already ends with /preview or /embed, use as-is
    if (
      pathWithoutTrailingSlash.endsWith("/preview") ||
      pathWithoutTrailingSlash.endsWith("/embed")
    ) {
      embedUrl = url;
    } else {
      // Reconstruct URL with /preview appended to the path (before any query string)
      const baseUrl = `${parsed.protocol}//${parsed.host}${pathWithoutTrailingSlash}/preview`;
      embedUrl = baseUrl;
    }

    return { type: "google-docs", embedUrl };
  }

  // All other valid URLs
  return { type: "iframe", url };
}
