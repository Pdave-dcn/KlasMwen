import { useState } from "react";

import { Check, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAvatars } from "@/queries/useAvatar";

import LoadMoreButton from "./LoadMoreButton";

const AvatarModal = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onConfirmation,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onConfirmation: (avatarId: number, avatarUrl: string) => void;
}) => {
  const {
    data: avatars,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAvatars(24);

  const [selectedAvatar, setSelectedAvatar] = useState<{
    id: number;
    url: string;
  } | null>(null);

  const allAvatars = avatars?.pages?.flatMap((page) => page.data) ?? [];

  const handleAvatarClick = (avatar: { id: number; url: string }) => {
    setSelectedAvatar(avatar);
  };

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  const handleClose = () => {
    setSelectedAvatar(null);
    onClose();
  };

  const handleConfirmation = () => {
    if (selectedAvatar) onConfirmation(selectedAvatar.id, selectedAvatar.url);
    setSelectedAvatar(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose your new avatar</DialogTitle>
          <DialogDescription>
            Select an avatar from the collection below. Click on an avatar to
            select it.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading avatars...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load avatars. Please try again later.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                {allAvatars.map((avatar) => {
                  const isSelected = selectedAvatar?.id === avatar.id;
                  const isCurrent = currentAvatarUrl === avatar.url;

                  return (
                    <div
                      key={avatar.id}
                      className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:ring-1 hover:ring-muted-foreground"
                      }`}
                      onClick={() => handleAvatarClick(avatar)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleAvatarClick(avatar);
                        }
                      }}
                    >
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src={avatar.url}
                          alt={`Avatar ${avatar.id}`}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </AvatarFallback>
                      </Avatar>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}

                      {/* Current avatar indicator */}
                      {isCurrent && !isSelected && (
                        <div className="absolute -top-1 -right-1 bg-muted-foreground rounded-full p-1">
                          <div className="w-3 h-3 bg-background rounded-full" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <LoadMoreButton
                    isLoading={isFetchingNextPage}
                    onClick={handleLoadMore}
                    style="max-w-xs"
                  />
                </div>
              )}

              {/* No more avatars message */}
              {!hasNextPage && allAvatars.length > 0 && (
                <div className="text-center text-sm text-muted-foreground pt-4">
                  You've reached the end of available avatars.
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedAvatar}
            onClick={handleConfirmation}
            className="min-w-[100px] cursor-pointer"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarModal;
