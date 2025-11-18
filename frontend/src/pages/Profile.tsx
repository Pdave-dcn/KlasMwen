import { useEffect, useState } from "react";

import { useLocation, useParams } from "react-router-dom";

import { Spinner } from "@/components/ui/spinner";
import ProfileError from "@/features/profile/components/ProfileError";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import ProfileNotFound from "@/features/profile/components/ProfileNotFound";
import ProfileTabs from "@/features/profile/components/tabs/ProfileTabs";
import { useProfileUser } from "@/queries/useProfile";

const Profile = ({ isSelf = false }: { isSelf?: boolean }) => {
  const location = useLocation();
  const { id } = useParams();

  const actualSelf = isSelf || !id;
  const userId = !actualSelf ? id : undefined;

  const [activeTab, setActiveTab] = useState("posts");

  // useEffect(() => {
  //   if (location.state?.activeTab) {
  //     setActiveTab(location.state.activeTab);
  //     window.history.replaceState({}, document.title);
  //   }
  // }, [location.state]);

  useEffect(() => {
    setActiveTab("posts");

    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      window.history.replaceState({}, document.title);
    }
  }, [userId, actualSelf, location.state]);

  const { data: user, isLoading, error } = useProfileUser(userId as string);

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <Spinner />
      </main>
    );
  }

  if (error) {
    return <ProfileError />;
  }

  if (!user) {
    return <ProfileNotFound />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="relative px-4 md:px-8 pb-6 flex justify-center">
        <ProfileHeader user={user} isSelf={actualSelf} />
      </div>
      <div className="px-4 md:px-8 pb-8">
        <ProfileTabs
          key={userId ?? "self"}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userId={userId}
          isSelf={isSelf}
        />
      </div>
    </main>
  );
};

export default Profile;
