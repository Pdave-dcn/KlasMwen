import { useState } from "react";

import type { StudyCircle } from "@/zodSchemas/circle.zod";

import { CircleInfoSection } from "./CircleInfoSection";
import { EditCircleInfoDialog } from "./EditCircleInfoDialog";

interface GeneralTabProps {
  circle: StudyCircle;
}

export function GeneralTab({ circle }: GeneralTabProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Circle Info */}
      <CircleInfoSection
        circle={circle}
        onEditClick={() => setEditOpen(true)}
      />

      {/* Edit dialog — only mounts when open */}
      <EditCircleInfoDialog
        circle={circle}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
