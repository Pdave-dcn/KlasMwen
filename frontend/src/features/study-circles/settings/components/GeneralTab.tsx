import { useState } from "react";

import { Globe, Lock, Save, Camera } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

import { CircleAvatar } from "../../hub/components/ChatGroupPreview/CircleAvatar";
import { CircleGate } from "../../security/CircleGate";
import { useCirclePermission } from "../../security/useCirclePermission";

interface GeneralTabProps {
  circle: StudyCircle;
}

const NAME_MAX = 100;
const DESC_MAX = 500;

export function GeneralTab({ circle }: GeneralTabProps) {
  const [name, setName] = useState(circle.name);
  const [description, setDescription] = useState(circle.description ?? "");
  const [isPrivate, setIsPrivate] = useState(circle.isPrivate);

  // Single source of truth for edit permission
  const { can } = useCirclePermission();
  const canEdit = can("circles", "update");

  const handleSave = () => {
    toast.success("Circle settings saved!");
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          <CircleAvatar name={circle.name} avatar={circle.avatar?.url} />
          {/* Camera overlay only visible to editors */}
          <CircleGate resource="circles" action="update">
            <button className="absolute inset-0 rounded-2xl bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </button>
          </CircleGate>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {name || "Circle Name"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Active since{" "}
            {new Date(circle.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="circle-name" className="text-foreground">
            Circle Name
          </Label>
          <span
            className={cn(
              "text-xs",
              name.length > NAME_MAX
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {name.length}/{NAME_MAX}
          </span>
        </div>
        <Input
          id="circle-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          disabled={!canEdit}
          className="rounded-xl"
          placeholder="Enter circle name"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="circle-desc" className="text-foreground">
            Description
          </Label>
          <span
            className={cn(
              "text-xs",
              description.length > DESC_MAX
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {description.length}/{DESC_MAX}
          </span>
        </div>
        <Textarea
          id="circle-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
          disabled={!canEdit}
          rows={4}
          className="rounded-xl resize-none"
          placeholder="Describe your study circle..."
        />
      </div>

      {/* Privacy */}
      <div className="space-y-3">
        <Label className="text-foreground">Privacy</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: true,
              icon: Globe,
              label: "Public",
              desc: "Appears in search & discovery",
            },
            {
              value: false,
              icon: Lock,
              label: "Private",
              desc: "Invite-only, hidden from search",
            },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              disabled={!canEdit}
              onClick={() => setIsPrivate(opt.value)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                isPrivate === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30",
                !canEdit && "opacity-60 cursor-not-allowed",
              )}
            >
              <opt.icon
                className={cn(
                  "h-5 w-5",
                  isPrivate === opt.value
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <div>
                <p className="font-medium text-foreground text-sm">
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Save button — only rendered for editors */}
      <CircleGate resource="circles" action="update">
        <Button onClick={handleSave} className="w-full rounded-xl gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </CircleGate>
    </div>
  );
}
