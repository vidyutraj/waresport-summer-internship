"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { InlineResourceViewer } from "@/components/shared/InlineResourceViewer";

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
  isOpen,
  onToggle,
  editControl,
  deleteControl,
}: ResourceCardProps) {
  return (
    <Card className="hover:border-brand-200 transition-colors">
      <CardContent className="p-5">
        {/* Header row: title + required star */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {resource.title}
          </h3>
          {resource.isRequired && (
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {resource.description}
          </p>
        )}

        {/* Category + required badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="outline">{resource.category}</Badge>
          {resource.isRequired && <Badge variant="warning">Required</Badge>}
        </div>

        {/* Footer row: date + action buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-gray-400">{formatDate(resource.createdAt)}</span>

          <div className="flex items-center gap-2">
            {/* Admin controls */}
            {isAdmin && editControl}
            {isAdmin && deleteControl}

            {/* Expand / collapse button — native <button> for keyboard accessibility */}
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              {isOpen ? "Close" : "View"}
            </button>

            {/* External link — always present */}
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Inline viewer — rendered below metadata when open */}
        {isOpen && (
          <InlineResourceViewer
            url={resource.url}
            title={resource.title}
            description={resource.description}
          />
        )}
      </CardContent>
    </Card>
  );
}
