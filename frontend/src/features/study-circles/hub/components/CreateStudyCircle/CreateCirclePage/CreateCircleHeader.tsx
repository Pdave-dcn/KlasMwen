import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CreateGroupHeaderProps {
  onBack: () => void;
}

export function CreateCircleHeader({ onBack }: CreateGroupHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBack()}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-foreground">
            Back to Hub
          </span>
        </div>
      </div>
    </header>
  );
}
