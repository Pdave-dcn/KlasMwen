import { Timer, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ChatSettingsProps {
  slowMode: boolean;
  onSlowModeToggle: (checked: boolean) => void;
  onClearChatRequest: () => void;
}

export function ChatSettings({
  slowMode,
  onSlowModeToggle,
  onClearChatRequest,
}: ChatSettingsProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground">Chat Settings</h4>

      {/* Slow Mode */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Timer className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Label
              htmlFor="slow-mode"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Slow Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Members must wait 5 seconds between messages
            </p>
          </div>
        </div>
        <Switch
          id="slow-mode"
          checked={slowMode}
          onCheckedChange={onSlowModeToggle}
        />
      </div>

      {/* Clear Chat */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Clear Chat History
            </p>
            <p className="text-xs text-muted-foreground">
              Permanently delete all messages
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={onClearChatRequest}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
