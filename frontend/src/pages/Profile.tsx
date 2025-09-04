import { useState } from "react";

import { useParams } from "react-router-dom";

import {
  GraduationCap,
  MapPin,
  Calendar,
  Edit2,
  BookOpen,
  Heart,
  MessageSquare,
} from "lucide-react";

import { PostCard } from "@/components/PostCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import usePosts from "@/queries/usePosts";
import useProfile from "@/queries/useProfile";

import { mockUser, userStats } from "./profilePageMockData";

const Profile = ({ isSelf = false }: { isSelf?: boolean }) => {
  const [activeTab, setActiveTab] = useState("posts");

  const { id } = useParams();
  const actualSelf = isSelf || !id;
  const userId = !actualSelf ? id : undefined;

  const { data: user, isLoading: userLoading } = useProfile(userId);
  const { data: posts, isLoading: postsLoading } = usePosts(userId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div>
        {/* Profile Info */}
        <div className="relative px-4 md:px-8 pb-6">
          {userLoading ? (
            // User info loading spinner
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          ) : (
            <>
              {/* Mobile Layout */}
              <div className="md:hidden mb-10">
                {/* Top row with avatar, name and buttons */}
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
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit Profile
                      </Button>
                      {/* <Button variant="outline" size="sm" className="px-3">
                        <Settings className="w-4 h-4" />
                      </Button> */}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex justify-around py-4 border-t border-b border-border mt-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {userStats.posts}
                    </div>
                    <div className="text-xs text-muted-foreground">posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {userStats.followers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      followers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">
                      {userStats.following}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      following
                    </div>
                  </div>
                </div>

                {/* Bio and details */}
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm">{mockUser.major}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{mockUser.university}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Joined January 2024</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="mb-3 capitalize">
                    {user?.role}
                  </Badge>

                  {user?.bio && (
                    <p className="text-sm text-foreground">{user?.bio}</p>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-center">
                <div className="items-center gap-10 mt-5 p-10 flex">
                  {/* Avatar */}
                  <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.avatar?.url} alt={user?.username} />
                    <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                      {user?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-6">
                        <h1 className="text-3xl font-light text-foreground">
                          {user?.username}
                        </h1>
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                          </Button>
                          {/* <Button variant="outline" size="sm" className="gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Button> */}
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-8 mb-4">
                      <div className="text-center">
                        <span className="text-lg font-semibold text-foreground mr-1">
                          {userStats.posts}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          posts
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-semibold text-foreground mr-1">
                          {userStats.followers}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          followers
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-semibold text-foreground mr-1">
                          {userStats.following}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          following
                        </span>
                      </div>
                    </div>

                    {/* Bio and details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span className="text-sm">{mockUser.major}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{mockUser.university}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Joined January 2024</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="mb-3 capitalize">
                        {mockUser.role}
                      </Badge>

                      {user?.bio && (
                        <p className="text-sm text-foreground max-w-md">
                          {user?.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 md:px-8 pb-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3 self-center">
            <TabsTrigger value="posts" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="w-4 h-4" />
              Liked
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="posts" className="space-y-6">
              {postsLoading ? (
                // Posts loading spinner
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Spinner />
                    <p className="text-sm text-muted-foreground">
                      Loading posts...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts?.pages.flatMap((page) =>
                    page.data.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={(postId) => console.log("Like post:", postId)}
                        onBookmark={(postId) =>
                          console.log("Bookmark post:", postId)
                        }
                        onComment={(postId) =>
                          console.log("Comment on post:", postId)
                        }
                      />
                    ))
                  )}
                  {/* Show empty state if no posts */}
                  {posts?.pages.every((page) => page.data.length === 0) && (
                    <Card className="p-8 text-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No posts yet
                      </h3>
                      <p className="text-muted-foreground">
                        Start sharing your knowledge and connect with your
                        peers!
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked" className="space-y-6">
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

            <TabsContent value="saved" className="space-y-6">
              <Card className="p-8 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No saved posts yet
                </h3>
                <p className="text-muted-foreground">
                  Save posts to read them later or reference them for your
                  studies.
                </p>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
