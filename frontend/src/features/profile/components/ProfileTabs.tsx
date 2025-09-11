import {
  BookOpen,
  Heart,
  MessageSquare,
  MessageCircle,
  Image,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfilePosts } from "@/queries/usePosts";

import ProfileBookmarks from "./ProfileBookmarks";
import ProfileLikedPosts from "./ProfileLikedPosts";
import ProfilePosts from "./ProfilePosts";
import ProfileReplies from "./ProfileReplies";

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: React.Dispatch<React.SetStateAction<string>>;
  userId: string | undefined;
  isSelf: boolean;
}

const ProfileTabs = ({
  activeTab,
  onTabChange,
  userId,
  isSelf,
}: ProfileTabsProps) => {
  const {
    data: posts,
    isLoading: postsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    error: postsError,
  } = useProfilePosts(userId);

  const selfTabs = [
    { value: "posts", icon: BookOpen, label: "Posts" },
    { value: "liked", icon: Heart, label: "Liked" },
    { value: "saved", icon: MessageSquare, label: "Saved" },
  ];

  const otherUserTabs = [
    { value: "posts", icon: BookOpen, label: "Posts" },
    { value: "replies", icon: MessageCircle, label: "Replies" },
    { value: "media", icon: Image, label: "Media" },
  ];

  const currentTabs = isSelf ? selfTabs : otherUserTabs;

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex flex-col"
    >
      <TabsList className="grid w-full max-w-md grid-cols-3 self-center">
        {currentTabs.map(({ value, icon: Icon, label }) => (
          <TabsTrigger key={value} value={value} className="gap-2">
            <Icon className="w-4 h-4" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="posts">
          <ProfilePosts
            posts={posts}
            postsLoading={postsLoading}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            error={postsError}
          />
        </TabsContent>

        {isSelf ? (
          <>
            <TabsContent value="liked">
              <ProfileLikedPosts />
            </TabsContent>

            <TabsContent value="saved">
              <ProfileBookmarks />
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="replies">
              <ProfileReplies />
            </TabsContent>

            <TabsContent value="media">
              <Card className="p-8 text-center">
                <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No media posts yet
                </h3>
                <p className="text-muted-foreground">
                  Posts with images and media will appear here.
                </p>
              </Card>
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};

export default ProfileTabs;
