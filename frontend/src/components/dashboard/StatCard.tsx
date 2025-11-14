import { Card } from "@/components/ui/card";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "default" | "pending" | "reviewed" | "dismissed";
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  variant = "default",
}: StatCardProps) => {
  const variantStyles = {
    default: "bg-card border-border",
    pending: "bg-pending/10 border-pending/20",
    reviewed: "bg-reviewed/10 border-reviewed/20",
    dismissed: "bg-muted border-border",
  };

  const iconStyles = {
    default: "text-primary",
    pending: "text-pending",
    reviewed: "text-reviewed",
    dismissed: "text-dismissed",
  };

  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div
          className={`p-3 rounded-lg bg-background/50 ${iconStyles[variant]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};
