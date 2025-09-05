import { BookOpen, Heart, MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProfilePosts from "./ProfilePosts";

const ProfileTabs = ({ activeTab, onTabChange, posts, postsLoading }: any) => (
  <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col">
    <TabsList className="grid w-full max-w-md grid-cols-3 self-center">
      <TabsTrigger value="posts" className="gap-2">
        <BookOpen className="w-4 h-4" /> Posts
      </TabsTrigger>
      <TabsTrigger value="liked" className="gap-2">
        <Heart className="w-4 h-4" /> Liked
      </TabsTrigger>
      <TabsTrigger value="saved" className="gap-2">
        <MessageSquare className="w-4 h-4" /> Saved
      </TabsTrigger>
    </TabsList>

    <div className="mt-6">
      <TabsContent value="posts">
        <ProfilePosts posts={posts} postsLoading={postsLoading} />
      </TabsContent>

      <TabsContent value="liked">
        <Card className="p-8 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No liked posts yet
          </h3>
          <p className="text-muted-foreground">
            Posts you like will appear here for easy access.
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="saved">
        <Card className="p-8 text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No saved posts yet
          </h3>
          <p className="text-muted-foreground">
            Save posts to read them later or reference them for your studies.
          </p>
        </Card>
      </TabsContent>
    </div>
  </Tabs>
);

export default ProfileTabs;
