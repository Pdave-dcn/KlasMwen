import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

export const Logo = ({ isHidden }: { isHidden: boolean }) => (
  <div className="flex items-center gap-2">
    <div>
      <BookOpen
        className={cn(
          "w-7 h-7",
          isHidden ? "hidden md:block" : "hidden md:block lg:hidden"
        )}
      />
      <div className={cn(isHidden ? "hidden" : "hidden lg:block")}>
        <h1 className="text-xl font-bold bg-gradient-primary">KlasMwen</h1>
        <p className="text-xs text-muted-foreground">Learn. Share. Grow.</p>
      </div>
    </div>
  </div>
);
