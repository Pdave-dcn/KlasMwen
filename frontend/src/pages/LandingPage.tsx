import LandingFooter from "@/features/landingPage/LandingFooter";
import LandingHero from "@/features/landingPage/LandingHero";

const LandingPage = () => {
  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <LandingFooter />
    </main>
  );
};

export default LandingPage;
