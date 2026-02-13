import { Lightbulb } from "lucide-react";

import type { CreateGroupFormData } from "@/zodSchemas/chat.zod";

import { CreateGroupForm } from "./CreateGroupForm";
import { TipsAccordion } from "./TipsAccordion";

interface CreateGroupContentProps {
  onSubmit: (data: CreateGroupFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateGroupContent({
  onSubmit,
  isSubmitting,
}: CreateGroupContentProps) {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Form (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <CreateGroupForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
          </div>
        </div>

        {/* Right: Tips */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              Tips for Success
            </div>
            <TipsAccordion />
          </div>
        </div>
      </div>
    </main>
  );
}
