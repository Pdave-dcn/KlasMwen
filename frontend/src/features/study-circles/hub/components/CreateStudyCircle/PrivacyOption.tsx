import { Globe, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

interface PrivacyOptionProps {
  type: "public" | "private";
  isSelected: boolean;
  onClick: () => void;
}

const PRIVACY_CONFIG = {
  public: {
    icon: Globe,
    title: "Public",
    description:
      "Anyone can discover, browse, and join your group from the Discovery portal.",
  },
  private: {
    icon: Lock,
    title: "Private",
    description:
      "Only people you invite via a link or username can join. Hidden from Discovery.",
  },
};

export function PrivacyOption({
  type,
  isSelected,
  onClick,
}: PrivacyOptionProps) {
  const config = PRIVACY_CONFIG[type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border text-left transition-all duration-200",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
          : "border-border bg-card hover:bg-muted/30",
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isSelected ? "bg-primary/20" : "bg-muted",
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isSelected ? "text-primary" : "text-muted-foreground",
            )}
          />
        </div>
      </div>
      <span
        className={cn(
          "font-semibold text-sm block mb-1",
          isSelected ? "text-primary" : "text-foreground",
        )}
      >
        {config.title}
      </span>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {config.description}
      </p>
    </button>
  );
}
