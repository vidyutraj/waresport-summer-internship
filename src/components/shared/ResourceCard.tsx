"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    category: string;
    isRequired: boolean;
    createdAt: Date;
    uploader: { name: string };
  };
  isAdmin?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  editControl?: React.ReactNode;
  deleteControl?: React.ReactNode;
}

export function ResourceCard({
  resource,
  isAdmin = false,
  editControl,
  deleteControl,
}: ResourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Only show "Show more" if description is long enough to be clipped at 3 lines
  // (~180 chars is a rough threshold for 3 lines at small text)
  const isLong = (resource.description?.length ?? 0) > 180;

  return (
    <Card className="hover:border-brand-200 transition-colors">
      <CardContent className="p-5">
        {/* Header row: title + required star + admin controls */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {resource.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {resource.isRequired && (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            )}
            {isAdmin && editControl}
            {isAdmin && deleteControl}
          </div>
        </div>

        {/* Description with expand/collapse */}
        {resource.description && (
          <div className="mb-3">
            <p className={`text-xs text-gray-500 ${expanded ? "" : "line-clamp-3"}`}>
              {resource.description}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-brand-600 hover:text-brand-700 mt-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Category + required badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="outline">{resource.category}</Badge>
          {resource.isRequired && <Badge variant="warning">Required</Badge>}
        </div>

        {/* Footer: date + open link */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{formatDate(resource.createdAt)}</span>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
