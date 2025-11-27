import DiscoverCTA from "@/features/discoverPage/components/DiscoverCTA";
import DiscoverFeatures from "@/features/discoverPage/components/DiscoverFeatures";
import DiscoverFooter from "@/features/discoverPage/components/DiscoverFooter";
import DiscoverHero from "@/features/discoverPage/components/DiscoverHero";
import DiscoverHowItWorks from "@/features/discoverPage/components/DiscoverHowItWorks";
import DiscoverNav from "@/features/discoverPage/components/DiscoverNav";
import DiscoverTrust from "@/features/discoverPage/components/DiscoverTrust";

const DiscoverPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <DiscoverNav />
      <DiscoverHero />
      <DiscoverFeatures />
      <DiscoverHowItWorks />
      <DiscoverTrust />
      <DiscoverCTA />
      <DiscoverFooter />
    </main>
  );
};

export default DiscoverPage;
