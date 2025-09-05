import { Edit2, RefreshCw, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { userStats } from "@/pages/profilePageMockData";
import type { ActiveUser, PublicUser } from "@/types/user.type";

import ProfileBio from "./ProfileBio";
import ProfileStats from "./ProfileStats";

interface ProfileHeaderProps {
  user: ActiveUser | PublicUser;
  isSelf: boolean;
}

const ProfileHeader = ({ user, isSelf }: ProfileHeaderProps) => {
  if (!user) {
    return (
      <>
        <div className="md:hidden mb-10">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              User Not Found
            </h2>
            <p className="text-gray-500 text-center mb-6">
              This profile doesn't exist or may have been removed.
            </p>
            <Button className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
        {/* Desktop layout error */}
        <div className="hidden md:flex items-center justify-center">
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <User className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">
              User Not Found
            </h2>
            <p className="text-gray-500 text-center mb-8 max-w-md">
              This profile doesn't exist or may have been removed. Please check
              the username and try again.
            </p>
            <Button className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
        )
      </>
    );
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="md:hidden mb-10">
        <div className="flex items-center gap-4 mt-5">
          <Avatar className="w-20 h-20 border-2 border-background">
            <AvatarImage src={user?.avatar?.url} alt={user?.username} />
            <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground mb-2">
              {user?.username}
            </h1>
            {isSelf && (
              <Button variant="outline" size="sm" className="flex-1">
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <ProfileStats stats={userStats} />

        <ProfileBio user={user} />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-center">
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
                  <Button variant="outline" size="sm" className="gap-2">
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
