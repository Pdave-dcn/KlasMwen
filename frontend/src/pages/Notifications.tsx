import { CheckCheck, Bell } from "lucide-react";

import LoadMoreButton from "@/components/LoadMoreButton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationEmptyState } from "@/features/notification/components/NotificationEmptyState";
import { NotificationItem } from "@/features/notification/components/NotificationItem";
import { NotificationSkeleton } from "@/features/notification/components/NotificationSkeleton";
import { useNotifications, type ReadFilter } from "@/hooks/useNotifications";
import type { NotificationType } from "@/zodSchemas/notification.zod";

const Notifications = () => {
  const {
    readFilter,
    typeFilter,
    unreadCount,
    notifications,
    isLoading,
    hasActiveFilters,
    setReadFilter,
    setTypeFilter,
    handleMarkAllRead,
    handleMarkAsRead,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications(20);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-3">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-semibold text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated on activity related to your posts and comments
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Read Status Filter */}
            <Tabs
              value={readFilter}
              onValueChange={(value) => setReadFilter(value as ReadFilter)}
            >
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread
                </TabsTrigger>
                <TabsTrigger value="read" className="text-xs">
                  Read
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as NotificationType | "all")
              }
            >
              <SelectTrigger className="h-9 w-35">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="COMMENT_ON_POST">Comments</SelectItem>
                <SelectItem value="REPLY_TO_COMMENT">Replies</SelectItem>
                <SelectItem value="LIKE">Likes</SelectItem>
                <SelectItem value="REPORT_UPDATE">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mark All Read */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        {/* Notification List */}
        <div className="space-y-1">
          {isLoading ? (
            // Loading State
            Array.from({ length: 10 }).map((_, i) => (
              <NotificationSkeleton key={`item-${i + 1}`} />
            ))
          ) : notifications.length === 0 ? (
            // Empty State
            <NotificationEmptyState hasFilters={hasActiveFilters} />
          ) : (
            // Notification Items
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      </div>

      {hasNextPage && (
        <LoadMoreButton
          isLoading={isFetchingNextPage}
          onClick={fetchNextPage}
          variant="secondary"
        />
      )}
    </div>
  );
};

export default Notifications;
