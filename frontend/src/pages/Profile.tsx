import { useState } from "react";

import { useParams } from "react-router-dom";

import { RefreshCw, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfileTabs from "@/features/profile/components/ProfileTabs";
import { useProfileUser } from "@/queries/useProfile";

const Profile = ({ isSelf = false }: { isSelf?: boolean }) => {
  const [activeTab, setActiveTab] = useState("posts");

  const { id } = useParams();
  const actualSelf = isSelf || !id;
  const userId = !actualSelf ? id : undefined;

  const { data: user, isLoading, error } = useProfileUser(userId as string);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error loading profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Something went wrong. Please try again later.
          </p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      <div className="relative px-4 md:px-8 pb-6 flex justify-center">
        <ProfileHeader user={user} isSelf={actualSelf} />
      </div>
      <div className="px-4 md:px-8 pb-8">
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userId={userId}
          isSelf={isSelf}
        />
      </div>
    </div>
  );
};

export default Profile;
