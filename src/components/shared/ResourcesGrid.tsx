"use client";

import React, { useState } from "react";
import { ResourceCard } from "@/components/shared/ResourceCard";

interface ResourcesGridProps {
  resources: Array<{
    id: string;
    title: string;
    description: string | null;
    url: string;
    category: string;
    isRequired: boolean;
    createdAt: Date;
    uploader: { name: string };
  }>;
  isAdmin?: boolean;
  adminControls?: Record<string, { edit: React.ReactNode; delete: React.ReactNode }>;
}

export function ResourcesGrid({ resources, isAdmin = false, adminControls }: ResourcesGridProps) {
  const [openResourceId, setOpenResourceId] = useState<string | null>(null);

  function onToggle(id: string) {
    setOpenResourceId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource) => {
        const controls = adminControls?.[resource.id];
        return (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isAdmin={isAdmin}
            isOpen={openResourceId === resource.id}
            onToggle={() => onToggle(resource.id)}
            editControl={isAdmin ? controls?.edit : undefined}
            deleteControl={isAdmin ? controls?.delete : undefined}
          />
        );
      })}
    </div>
  );
}
