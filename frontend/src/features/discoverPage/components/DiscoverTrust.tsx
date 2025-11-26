import { CheckCircle, Shield, Share2 } from "lucide-react";

import TrustBadge from "./TrustBadge";

const trustPoints = [
  {
    icon: CheckCircle,
    title: "Free Forever",
    description:
      "No subscriptions, no paywalls. Education should be accessible to all.",
    colorClass: "bg-green-500/10 text-green-600",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "Student-friendly environment with privacy and safety as top priorities.",
    colorClass: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Share2,
    title: "Collaborative",
    description:
      "Learn better together. Share knowledge and grow as a community.",
    colorClass: "bg-purple-500/10 text-purple-600",
  },
];

const DiscoverTrust = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built with Students in Mind
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {trustPoints.map((point) => (
            <TrustBadge key={point.title} {...point} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiscoverTrust;
