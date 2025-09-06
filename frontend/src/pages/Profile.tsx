import { useState } from "react";

import { useParams } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfileTabs from "@/features/profile/components/ProfileTabs";
import useProfile from "@/queries/useProfile";

const Profile = ({ isSelf = false }: { isSelf?: boolean }) => {
  const [activeTab, setActiveTab] = useState("posts");

  const { id } = useParams();
  const actualSelf = isSelf || !id;
  const userId = !actualSelf ? id : undefined;

  const { data: user, isLoading: userLoading } = useProfile(userId);

  if (!user) return;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative px-4 md:px-8 pb-6">
        {userLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <ProfileHeader user={user} isSelf={actualSelf} />
        )}
      </div>

      <div className="px-4 md:px-8 pb-8">
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userId={userId}
        />
      </div>
    </div>
  );
};

export default Profile;
