import { useState } from "react";

import { VolumeX, Volume2, Timer, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSetCircleMemberMuteMutation } from "@/queries/circle";
import { useCircleStore } from "@/stores/circle.store";
import type { CircleMember } from "@/zodSchemas/circle.zod";

interface ModerationTabProps {
  members: CircleMember[];
  slowMode: boolean;
  slowModeInterval: number;
}

export function ModerationTab({
  members,
  slowMode: initialSlowMode,
  slowModeInterval: _initialInterval,
}: ModerationTabProps) {
  // todo: implement slow mode interval setting and replace the hardcoded "5 seconds" text with the actual interval
  const [slowMode, setSlowMode] = useState(initialSlowMode);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentCircleId =
    useCircleStore((state) => state.selectedCircleId) ?? "";
  const setMuteMutation = useSetCircleMemberMuteMutation(currentCircleId);

  const mutedMembers = members.filter((m) => m.isMuted);

  const handleUnmute = (member: CircleMember) => {
    setMuteMutation.mutate({ userId: member.user.id, muted: false });
  };

  // todo: implement actual chat clearing functionality and remove the toast
  const handleClearChat = () => {
    toast.success("Chat history has been cleared.");
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-8">
      {/* Muted Members */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <VolumeX className="h-4 w-4 text-destructive" />
          <h4 className="font-semibold text-foreground">Muted Members</h4>
          {mutedMembers.length > 0 && (
            <Badge variant="secondary" className="rounded-lg text-xs">
              {mutedMembers.length}
            </Badge>
          )}
        </div>

        {mutedMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No muted members</p>
            <p className="text-xs mt-1">Everyone can speak freely!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mutedMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-semibold text-destructive">
                    {member.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.user.username}
                    </p>
                    {/* {member.isMuted && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {member.mutedUntil
                          ? `Until ${new Date(member.mutedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Indefinitely"}
                      </p>
                    )} */}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => handleUnmute(member)}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Unmute
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Settings */}
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
            onCheckedChange={(checked) => {
              setSlowMode(checked);
              toast.success(
                checked ? "Slow mode enabled." : "Slow mode disabled.",
              );
            }}
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
            onClick={() => setShowClearConfirm(true)}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear Chat History
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all messages in this circle. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearChat}
              className="rounded-xl"
            >
              Clear All Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
