import type { LucideIcon } from "lucide-react";

interface TrustIndicatorProps {
  icon: LucideIcon;
  text: string;
}

const TrustIndicator = ({ icon: Icon, text }: TrustIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {text}
    </div>
  );
};

export default TrustIndicator;
