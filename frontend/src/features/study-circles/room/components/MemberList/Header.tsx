import { Users } from "lucide-react";

import { useCircleStore } from "@/stores/circle.store";

interface HeaderProps {
  totalCount: number;
}

export const Header = ({ totalCount }: HeaderProps) => {
  const onlineCount = useCircleStore((state) => state.onlineMemberIds.size);
  const presenceCount = useCircleStore((state) => state.presentMemberIds.size);

  return (
    <div className="p-4 border-b border-border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Circle Members
        </h3>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
          {totalCount} Total
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Present: The highest priority info */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-xs font-medium text-foreground">
            {presenceCount} in this chat
          </span>
        </div>

        {/* Online: Secondary info */}
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">
            {onlineCount} online
          </span>
        </div>
      </div>
    </div>
  );
};
