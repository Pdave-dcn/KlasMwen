import { Globe, Lock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGroupInitials } from "@/utils/getInitials.util";

interface GroupPreviewCardProps {
  name: string;
  description: string;
  tags: string[];
  isPublic: boolean;
}

export function GroupPreviewCard({
  name,
  description,
  tags,
  isPublic,
}: GroupPreviewCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
            name ? "bg-linear-to-br from-primary to-primary/70" : "bg-muted",
          )}
        >
          <span className="text-sm font-bold text-primary-foreground">
            {getGroupInitials(name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate text-sm">
            {name || "Your Group Name"}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {description ||
              "Add a description to tell others what your group is about"}
          </p>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-0"
            >
              #{tag}
            </Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              +{tags.length - 4} more
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>1 member</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isPublic ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 gap-1"
            >
              <Globe className="w-3 h-3" /> Public
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
              <Lock className="w-3 h-3" /> Private
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
