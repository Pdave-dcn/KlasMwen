import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

interface ChatHubCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "primary" | "accent";
}

export const ChatHubCard = ({
  title,
  subtitle,
  icon: Icon,
  onClick,
  variant = "default",
}: ChatHubCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full p-6 rounded-2xl border text-left transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "primary" &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
        variant === "accent" &&
          "bg-accent text-accent-foreground border-accent hover:bg-accent/90",
        variant === "default" &&
          "bg-card text-card-foreground border-border hover:border-primary/50",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            variant === "primary" || variant === "accent"
              ? "bg-white/20"
              : "bg-primary/10 group-hover:bg-primary/20",
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6",
              variant === "primary" || variant === "accent"
                ? "text-white"
                : "text-primary",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-lg font-semibold mb-1",
              variant === "default" && "text-foreground",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-sm",
              variant === "primary" || variant === "accent"
                ? "text-white/80"
                : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        </div>

        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1",
            variant === "primary" || variant === "accent"
              ? "bg-white/20"
              : "bg-muted",
          )}
        >
          <svg
            className={cn(
              "w-4 h-4",
              variant === "primary" || variant === "accent"
                ? "text-white"
                : "text-muted-foreground",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
};
