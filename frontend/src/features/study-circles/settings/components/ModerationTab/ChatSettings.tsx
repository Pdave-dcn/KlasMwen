import { Timer, Trash2, Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface ChatSettingsProps {
  slowMode: boolean;
  onSlowModeToggle: (checked: boolean) => void;
  onClearChatRequest: () => void;
}

export function ChatSettings({
  slowMode: _slowMode,
  onSlowModeToggle: _onSlowModeToggle,
  onClearChatRequest,
}: ChatSettingsProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground">Chat Settings</h4>

      {/* Slow Mode — coming soon */}
      <div className="relative flex items-center justify-between p-4 rounded-xl border border-dashed border-border bg-muted/20 opacity-60 cursor-not-allowed select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Timer className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Slow Mode
              </p>
              <Badge
                variant="outline"
                className="gap-1 rounded-md text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground"
              >
                <Hammer className="h-2.5 w-2.5" />
                In progress
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Members must wait between messages — coming soon
            </p>
          </div>
        </div>
        <Switch id="slow-mode" disabled checked={false} />
      </div>

      {/* Clear Chat */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 border-dashed opacity-60 cursor-not-allowed select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                Clear Chat History
              </p>
              <Badge
                variant="outline"
                className="gap-1 rounded-md text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground"
              >
                <Hammer className="h-2.5 w-2.5" />
                In progress
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Permanently delete all messages — coming soon
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onClearChatRequest}
          disabled
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
