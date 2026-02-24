import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Globe,
  Lock,
  Users,
  Clock,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useCirclePreviewDetailsQuery,
  useJoinCircleMutation,
} from "@/queries/circle";
import { formatDate } from "@/utils/dateFormatter.util";

import { DetailError } from "../features/study-circles/hub/components/ChatGroupPreview/ErrorState";
import { GroupAvatar } from "../features/study-circles/hub/components/ChatGroupPreview/GroupAvatar";
import { DetailSkeleton } from "../features/study-circles/hub/components/ChatGroupPreview/LoadingState";
import {
  DesktopSidebar,
  MobileBottomBar,
  type ActionBarProps,
} from "../features/study-circles/hub/components/ChatGroupPreview/SidebarAndBottomBar";

// eslint-disable-next-line complexity
const CirclePreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: group,
    isLoading,
    isError,
    refetch,
  } = useCirclePreviewDetailsQuery(id ?? "");
  const joinChatGroupMutation = useJoinCircleMutation();

  const isJoining =
    joinChatGroupMutation.isPending &&
    joinChatGroupMutation.variables === group?.id;
  const isJoined =
    joinChatGroupMutation.isSuccess &&
    joinChatGroupMutation.variables === group?.id;

  const handleShare = () => {
    toast.info("Share feature coming soon!");
  };

  if (isLoading) return <DetailSkeleton />;
  if (isError || !group) return <DetailError onRefetch={refetch} />;

  const createdDate = formatDate(group.createdAt);
  const lastActivity = formatDate(group.lastActivityAt);

  const actionBarProps: ActionBarProps = {
    isJoined,
    isJoining,
    onJoin: () => joinChatGroupMutation.mutate(group.id),
    onLaunch: () => navigate(`/circles/${group.id}/public/details`),
    onShare: handleShare,
  };

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Sticky nav */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-foreground truncate">
            {group.name}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* ---- Main content ---- */}
          <div className="flex-1 space-y-6">
            {/* Hero header */}
            <div className="flex items-start gap-5">
              <GroupAvatar name={group.name} avatar={group.avatar?.url} />
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight mb-1.5">
                  {group.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "gap-1 text-xs",
                      !group.isPrivate
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {!group.isPrivate ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {!group.isPrivate ? "Public" : "Private"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="rounded-xl">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                  <Users className="w-5 h-5 text-primary mb-1" />
                  <span className="text-lg font-bold text-foreground">
                    {group.memberCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Members
                  </span>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                  <CalendarDays className="w-5 h-5 text-primary mb-1" />
                  <span className="text-sm font-bold text-foreground">
                    {createdDate}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Active since
                  </span>
                </CardContent>
              </Card>
              <Card className="rounded-xl">
                <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                  <Clock className="w-5 h-5 text-primary mb-1" />
                  <span className="text-sm font-bold text-foreground">
                    {lastActivity ?? "N/A"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Last activity
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="rounded-2xl">
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-foreground mb-2">
                  About
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {group.description ??
                    "This group hasn't added a description yet, but the curiosity is real!"}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {group.tags && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="rounded-lg text-xs px-3 py-1 font-normal"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Creator card */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Created by
              </h2>
              <div className="flex items-center gap-3">
                <GroupAvatar
                  name={group.creator.username}
                  avatar={group.creator.avatar?.url}
                  size="lg"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {group.creator.username}
                  </p>
                  <p className="text-xs text-muted-foreground">Group creator</p>
                </div>
              </div>
            </div>
          </div>

          <DesktopSidebar {...actionBarProps} />
        </div>
      </div>

      <MobileBottomBar {...actionBarProps} />
    </main>
  );
};

export default CirclePreviewPage;
