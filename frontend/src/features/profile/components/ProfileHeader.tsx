import { useNavigate } from "react-router-dom";

import { Edit2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { userStats } from "@/pages/profilePageMockData";
import type { User } from "@/types/auth.type";

import ProfileBio from "./ProfileBio";
import ProfileStats from "./ProfileStats";

interface ProfileHeaderProps {
  user: User;
  isSelf: boolean;
}

const ProfileHeader = ({ user, isSelf }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const handleNavigate = async () => {
    await navigate("/profile/edit");
  };
  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden mb-10 w-full">
        <div className="flex items-center justify-center gap-4 py-5">
          <Avatar className="w-20 h-20 border-2 border-background">
            <AvatarImage src={user?.avatar?.url} alt={user?.username} />
            <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {user?.username}
            </h1>
            {isSelf && (
              <Button
                onClick={handleNavigate}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <ProfileStats stats={userStats} />

        <ProfileBio user={user} />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex w-full max-w-2xl">
        <div className="items-center gap-10 mt-5 p-10 flex">
          <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
            <AvatarImage src={user?.avatar?.url} alt={user?.username} />
            <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <h1 className="text-3xl font-light text-foreground">
                  {user?.username}
                </h1>
                {isSelf && (
                  <Button
                    onClick={handleNavigate}
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <ProfileStats stats={userStats} />
            <ProfileBio user={user} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
