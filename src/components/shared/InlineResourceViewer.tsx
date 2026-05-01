"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { getEmbedStrategy } from "@/lib/embedStrategy";

interface InlineResourceViewerProps {
  url: string;
  title: string;
  description: string | null;
}

export function InlineResourceViewer({ url, title, description }: InlineResourceViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const strategy = getEmbedStrategy(url);

  // Show fallback card when strategy is "fallback" or when iframe errored
  if (strategy.type === "fallback" || hasError) {
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mb-4">{description}</p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Open in new tab <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Determine iframe src and whether to add sandbox
  let iframeSrc: string;
  let useSandbox = false;

  if (strategy.type === "youtube" || strategy.type === "google-docs") {
    iframeSrc = strategy.embedUrl;
  } else {
    // type === "iframe"
    iframeSrc = strategy.url;
    useSandbox = true;
  }

  return (
    <div className="mt-3">
      {/* Resource title heading */}
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        {title}
      </p>

      {/* Iframe container with spinner overlay */}
      <div className="relative w-full" style={{ minHeight: "400px" }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
        <iframe
          src={iframeSrc}
          title={title}
          width="100%"
          style={{ minHeight: "400px", display: "block" }}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          {...(useSandbox ? { sandbox: "allow-scripts allow-same-origin" } : {})}
          className="rounded-lg border border-gray-200"
        />
      </div>
    </div>
  );
}
