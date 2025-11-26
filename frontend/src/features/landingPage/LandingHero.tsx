import LandingBackgroundElements from "./LandingBackgroundElements";
import LandingCTA from "./LandingCTA";
import LandingNav from "./LandingNav";
import LandingTrustIndicators from "./LandingTrustIndicators";

const LandingHero = () => {
  return (
    <section className="bg-linear-to-br from-primary to-accent py-10 text-center relative overflow-hidden">
      <LandingNav />

      <div className="absolute inset-0 bg-black/20 dark:bg-transparent pointer-events-none" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Your Study Journey
              <span className="block bg-linear-to-r from-white to-white/80 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with fellow students, share knowledge, and accelerate your
              learning with the most engaging academic social platform.
            </p>

            <LandingCTA />
            <LandingTrustIndicators />
          </div>
        </div>

        <LandingBackgroundElements />
      </div>
    </section>
  );
};

export default LandingHero;
