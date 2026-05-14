import { Pencil, Globe, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleGate } from "@/features/study-circles/security/CircleGate";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

import { CircleAvatar } from "../../../hub/components/ChatGroupPreview/CircleAvatar";

interface CircleInfoSectionProps {
  circle: StudyCircle;
  onEditClick: () => void;
}

export function CircleInfoSection({
  circle,
  onEditClick,
}: CircleInfoSectionProps) {
  return (
    <div className="space-y-5">
      {/* Header row: avatar + name + edit button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CircleAvatar name={circle.name} avatar={circle.avatar?.url} />
          <div>
            <h3 className="font-semibold text-foreground text-base">
              {circle.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Active since{" "}
              {new Date(circle.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Edit button — OWNER only */}
        <CircleGate resource="circles" action="update">
          <Button
            variant="default"
            size="sm"
            className="rounded-xl gap-1.5 shrink-0"
            onClick={onEditClick}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </CircleGate>
      </div>

      {/* Description */}
      {circle.description ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {circle.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">
          No description yet.
        </p>
      )}

      {/* Privacy */}
      <div className="flex items-center gap-2">
        {circle.isPrivate ? (
          <Badge variant="secondary" className="gap-1.5 rounded-lg">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5 rounded-lg">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        )}
      </div>

      {/* Tags */}
      {circle.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {circle.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="rounded-lg text-xs bg-primary/10 text-primary border-primary/20"
            >
              #{tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
