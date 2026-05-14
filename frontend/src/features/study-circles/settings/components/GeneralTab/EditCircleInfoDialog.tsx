import { Globe, Lock } from "lucide-react";

import AvatarModal from "@/components/modals/AvatarModal";
import { TagSelector } from "@/components/TagSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StudyCircle } from "@/zodSchemas/circle.zod";

import { CircleAvatar } from "../../../hub/components/ChatGroupPreview/CircleAvatar";
import { useEditCircleInfo } from "../../hooks/useEditCircleInfo";

interface EditCircleInfoDialogProps {
  circle: StudyCircle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const privacyOptions = [
  {
    value: false,
    icon: Globe,
    label: "Public",
    desc: "Appears in search & discovery",
  },
  {
    value: true,
    icon: Lock,
    label: "Private",
    desc: "Invite-only, hidden from search",
  },
];

export function EditCircleInfoDialog({
  circle,
  open,
  onOpenChange,
}: EditCircleInfoDialogProps) {
  const {
    form,
    onSubmit,
    isPending,
    currentAvatarUrl,
    isAvatarModalOpen,
    handlers,
    pagination,
    avatars,
    isLoadingAvatars,
    isAvatarError,
  } = useEditCircleInfo({
    circle,
    onSuccess: () => onOpenChange(false),
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const name = watch("name");
  const description = watch("description") ?? "";
  const isPrivate = watch("isPrivate");
  const tagIds = watch("tagIds");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Circle Info</DialogTitle>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <CircleAvatar name={circle.name} avatar={currentAvatarUrl} />
                <button
                  type="button"
                  onClick={handlers.handleOpenAvatarModal}
                  className="absolute inset-0 rounded-2xl bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="text-xs font-medium text-primary-foreground">
                    Change
                  </span>
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Circle Avatar
                </p>
                <button
                  type="button"
                  onClick={handlers.handleOpenAvatarModal}
                  className="text-xs text-primary hover:underline mt-0.5"
                >
                  Choose from library
                </button>
              </div>
            </div>

            {/* Hidden avatarId field keeps it in the form state */}
            <input type="hidden" {...register("avatarId")} />

            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-circle-name">Circle Name</Label>
                <span
                  className={cn(
                    "text-xs",
                    name && name.length > 100
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {name ? name.length : 0}/100
                </span>
              </div>
              <Input
                id="edit-circle-name"
                {...register("name")}
                className={cn(
                  "rounded-xl",
                  errors.name && "border-destructive",
                )}
                placeholder="Enter circle name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-circle-desc">Description</Label>
                <span
                  className={cn(
                    "text-xs",
                    description.length > 500
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {description.length}/500
                </span>
              </div>
              <Textarea
                id="edit-circle-desc"
                {...register("description")}
                rows={3}
                className={cn(
                  "rounded-xl resize-none",
                  errors.description && "border-destructive",
                )}
                placeholder="Describe your study circle..."
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Privacy */}
            <div className="space-y-2">
              <Label>Privacy</Label>
              <div className="grid grid-cols-2 gap-3">
                {privacyOptions.map((opt) => (
                  <button
                    type="button"
                    key={String(opt.value)}
                    onClick={() => setValue("isPrivate", opt.value)}
                    className={cn(
                      "flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left",
                      isPrivate === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30",
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
                      <p className="text-xs text-muted-foreground">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Topics</Label>
              <TagSelector
                selectedTagIds={tagIds ?? []}
                onChange={(ids) => setValue("tagIds", ids)}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl gap-2"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Avatar modal renders outside the edit dialog to avoid nesting issues */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={handlers.handleCloseAvatarModal}
        onConfirmation={handlers.handleSelectAvatar}
        currentAvatarUrl={currentAvatarUrl}
        avatars={avatars}
        isLoading={isLoadingAvatars}
        isError={isAvatarError}
        hasNextPage={pagination.hasNextPage}
        isFetchingNextPage={pagination.isFetchingNextPage}
        onLoadMore={pagination.handleLoadMore}
      />
    </>
  );
}
