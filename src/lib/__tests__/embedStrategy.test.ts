// Feature: platform-resources-social
import * as fc from "fast-check";
import { getEmbedStrategy } from "../embedStrategy";

// ---------------------------------------------------------------------------
// Property 4: YouTube URL embed strategy
// Validates: Requirements 5.1
// ---------------------------------------------------------------------------
describe("Property 4: YouTube URL embed strategy", () => {
  // Arbitrary valid YouTube video IDs: alphanumeric + `-_`, 11 chars
  const videoIdArb = fc.string({
    unit: fc.mapToConstant(
      { num: 26, build: (i) => String.fromCharCode(65 + i) }, // A-Z
      { num: 26, build: (i) => String.fromCharCode(97 + i) }, // a-z
      { num: 10, build: (i) => String.fromCharCode(48 + i) }, // 0-9
      { num: 1, build: () => "-" },
      { num: 1, build: () => "_" }
    ),
    minLength: 11,
    maxLength: 11,
  });

  it("returns youtube strategy for youtube.com/watch?v= URLs", () => {
    fc.assert(
      fc.property(videoIdArb, (videoId) => {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const result = getEmbedStrategy(url);

        expect(result.type).toBe("youtube");
        if (result.type === "youtube") {
          expect(result.embedUrl).toContain("youtube.com/embed/");
          expect(result.embedUrl).toContain(videoId);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns youtube strategy for youtu.be/{id} short URLs", () => {
    fc.assert(
      fc.property(videoIdArb, (videoId) => {
        const url = `https://youtu.be/${videoId}`;
        const result = getEmbedStrategy(url);

        expect(result.type).toBe("youtube");
        if (result.type === "youtube") {
          expect(result.embedUrl).toContain("youtube.com/embed/");
          expect(result.embedUrl).toContain(videoId);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Google Docs/Drive URL embed strategy
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------
describe("Property 5: Google Docs/Drive URL embed strategy", () => {
  // Arbitrary path segments (non-empty, URL-safe characters)
  const pathSegmentArb = fc.string({
    unit: fc.mapToConstant(
      { num: 26, build: (i) => String.fromCharCode(65 + i) }, // A-Z
      { num: 26, build: (i) => String.fromCharCode(97 + i) }, // a-z
      { num: 10, build: (i) => String.fromCharCode(48 + i) }, // 0-9
      { num: 1, build: () => "-" },
      { num: 1, build: () => "_" }
    ),
    minLength: 1,
    maxLength: 20,
  });

  const googleHostArb = fc.constantFrom(
    "docs.google.com",
    "drive.google.com"
  );

  it("returns google-docs strategy for docs.google.com and drive.google.com URLs", () => {
    fc.assert(
      fc.property(googleHostArb, pathSegmentArb, (host, pathSegment) => {
        const url = `https://${host}/document/d/${pathSegment}/edit`;
        const result = getEmbedStrategy(url);

        expect(result.type).toBe("google-docs");
        if (result.type === "google-docs") {
          // embedUrl must be a valid URL
          expect(() => new URL(result.embedUrl)).not.toThrow();
          // embedUrl must be derived from the input (same host)
          const embedParsed = new URL(result.embedUrl);
          expect(embedParsed.hostname).toBe(host);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests for edge cases (Task 1.3)
// Validates: Requirements 5.1, 5.2, 5.3, 5.4
// ---------------------------------------------------------------------------
describe("getEmbedStrategy — unit tests", () => {
  it("returns fallback for a malformed URL", () => {
    expect(getEmbedStrategy("not a url")).toEqual({ type: "fallback" });
    expect(getEmbedStrategy("")).toEqual({ type: "fallback" });
    expect(getEmbedStrategy("://bad")).toEqual({ type: "fallback" });
  });

  it("returns iframe for a plain https URL", () => {
    const result = getEmbedStrategy("https://example.com");
    expect(result).toEqual({ type: "iframe", url: "https://example.com" });
  });

  it("returns iframe for a plain http URL", () => {
    const result = getEmbedStrategy("http://example.com/some/path");
    expect(result).toEqual({
      type: "iframe",
      url: "http://example.com/some/path",
    });
  });

  it("extracts the correct video ID from a youtu.be short URL", () => {
    const result = getEmbedStrategy("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({
      type: "youtube",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
  });

  it("extracts the correct video ID from a youtube.com/watch URL", () => {
    const result = getEmbedStrategy(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    expect(result).toEqual({
      type: "youtube",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
  });

  it("returns google-docs for a Google Slides URL", () => {
    const result = getEmbedStrategy(
      "https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit"
    );
    expect(result.type).toBe("google-docs");
    if (result.type === "google-docs") {
      expect(result.embedUrl).toContain("docs.google.com");
      expect(result.embedUrl).toContain("/preview");
    }
  });

  it("returns google-docs for a Google Docs URL", () => {
    const result = getEmbedStrategy(
      "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit"
    );
    expect(result.type).toBe("google-docs");
    if (result.type === "google-docs") {
      expect(result.embedUrl).toContain("/preview");
    }
  });

  it("does not double-append /preview if already present", () => {
    const result = getEmbedStrategy(
      "https://docs.google.com/document/d/abc123/preview"
    );
    expect(result.type).toBe("google-docs");
    if (result.type === "google-docs") {
      // Should not be /preview/preview
      expect(result.embedUrl).not.toContain("/preview/preview");
    }
  });

  it("returns google-docs for a drive.google.com URL", () => {
    const result = getEmbedStrategy(
      "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/view"
    );
    expect(result.type).toBe("google-docs");
  });
});
