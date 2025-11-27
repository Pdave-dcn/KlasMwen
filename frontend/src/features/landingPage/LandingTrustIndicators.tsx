import { CheckCircle, Shield, Users } from "lucide-react";

import TrustIndicator from "./TrustIndicator";

const trustIndicators = [
  { icon: CheckCircle, text: "Free Forever" },
  { icon: Shield, text: "Safe & Student-Friendly" },
  { icon: Users, text: "Stronger Together" },
];

const LandingTrustIndicators = () => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-8 text-white/70 text-sm">
      {trustIndicators.map((indicator) => (
        <TrustIndicator key={indicator.text} {...indicator} />
      ))}
    </div>
  );
};

export default LandingTrustIndicators;
