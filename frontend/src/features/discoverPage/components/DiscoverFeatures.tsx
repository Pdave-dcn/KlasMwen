import {
  MessageSquare,
  FileText,
  Upload,
  Users,
  Search,
  BookMarked,
} from "lucide-react";

import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: MessageSquare,
    title: "Ask & Answer",
    description:
      "Get help from peers and share your knowledge. Ask questions and receive thoughtful answers from fellow students who understand your challenges.",
  },
  {
    icon: FileText,
    title: "Share Notes",
    description:
      "Create and share study notes, tips, and learning resources. Help others while reinforcing your own understanding.",
  },
  {
    icon: Upload,
    title: "Upload Resources",
    description:
      "Share PDFs, Excel sheets, and eBooks. Build a collective library of educational materials accessible to everyone.",
  },
  {
    icon: Users,
    title: "Build Community",
    description:
      "Connect with students who share your interests and academic goals. Learn together and support each other's growth.",
  },
  {
    icon: Search,
    title: "Discover Content",
    description:
      "Find exactly what you need with powerful search and filtering. Explore posts, notes, and resources by topic or tag.",
  },
  {
    icon: BookMarked,
    title: "Save for Later",
    description:
      "Bookmark helpful posts and resources. Build your personal library of go-to study materials for quick reference.",
  },
];

const DiscoverFeatures = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Makes KlasMwen Special?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete learning ecosystem built to support your academic journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiscoverFeatures;
