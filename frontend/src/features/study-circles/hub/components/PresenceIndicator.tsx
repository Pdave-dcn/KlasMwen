import { cn } from "@/lib/utils";

interface PresenceIndicatorProps {
  activeCount: number;
  className?: string;
  compact?: boolean;
}

export function PresenceIndicator({
  activeCount,
  className,
  compact = false,
}: PresenceIndicatorProps) {
  if (activeCount === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {!compact && (
        <span className="text-xs text-muted-foreground">
          {activeCount} {activeCount === 1 ? "student" : "students"} active
        </span>
      )}
    </div>
  );
}
