import { Globe, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

interface PrivacyOptionProps {
  type: "public" | "private";
  isSelected: boolean;
  onClick: () => void;
}

export function PrivacyOption({
  type,
  isSelected,
  onClick,
}: PrivacyOptionProps) {
  const isPublic = type === "public";
  const Icon = isPublic ? Globe : Lock;
  const label = isPublic ? "Public" : "Private";
  const description = isPublic
    ? "Anyone can discover and join this group"
    : "Only invited members can join";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border text-left transition-all",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isSelected ? "bg-primary/20" : "bg-muted",
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4",
              isSelected ? "text-primary" : "text-muted-foreground",
            )}
          />
        </div>
        <span
          className={cn(
            "font-medium",
            isSelected ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
