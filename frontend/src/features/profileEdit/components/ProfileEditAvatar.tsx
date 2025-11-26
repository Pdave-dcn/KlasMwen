import { Pencil } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import formatMemberSince from "@/utils/dateFormatter.util";

interface ProfileEditAvatarProps {
  username: string;
  avatarUrl: string;
  createdAt: string;
  onOpenModal: () => void;
}

const ProfileEditAvatar = ({
  username,
  avatarUrl,
  createdAt,
  onOpenModal,
}: ProfileEditAvatarProps) => {
  return (
    <div className="flex justify-between items-center bg-accent p-3 md:p-4 rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 md:w-16 md:h-16">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            {username ? username.slice(0, 2).toUpperCase() : ""}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg md:text-xl font-bold">@{username}</h2>
          <p className="text-sm text-muted-foreground">
            {formatMemberSince(createdAt)}
          </p>
        </div>
      </div>
      <Button onClick={onOpenModal} className="cursor-pointer">
        <span className="md:hidden">
          <Pencil className="w-4 h-4" />
        </span>
        <span className="hidden md:inline">Change Avatar</span>
      </Button>
    </div>
  );
};

export default ProfileEditAvatar;
