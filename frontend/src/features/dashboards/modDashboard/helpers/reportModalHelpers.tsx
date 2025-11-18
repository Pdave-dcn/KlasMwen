import { Badge } from "@/components/ui/badge";
import type { Report } from "@/zodSchemas/report.zod";

export const getStatusBadge = (status: Report["status"]) => {
  const variants = {
    PENDING: "bg-pending text-pending-foreground",
    REVIEWED: "bg-reviewed text-reviewed-foreground",
    DISMISSED: "bg-dismissed text-dismissed-foreground",
  };

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
