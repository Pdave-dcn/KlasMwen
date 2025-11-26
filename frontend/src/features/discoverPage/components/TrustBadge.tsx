import type { LucideIcon } from "lucide-react";

interface TrustBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass: string;
}

const TrustBadge = ({
  icon: Icon,
  title,
  description,
  colorClass,
}: TrustBadgeProps) => {
  return (
    <div className="text-center">
      <div
        className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4`}
      >
        <Icon className={`w-6 h-6 ${colorClass.replace("/10", "")}`} />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default TrustBadge;
