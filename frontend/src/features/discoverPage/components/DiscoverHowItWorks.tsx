import StepCard from "./StepCard";

const steps = [
  {
    step: 1,
    title: "Create Account",
    description:
      "Sign up for free with just your email. No credit card required, no hidden fees.",
  },
  {
    step: 2,
    title: "Explore & Contribute",
    description:
      "Browse content, ask questions, share notes, and upload resources that help others.",
  },
  {
    step: 3,
    title: "Learn Together",
    description:
      "Engage with the community, react to posts, comment, and grow your knowledge together.",
  },
];

const DiscoverHowItWorks = () => {
  return (
    <section className="py-20 px-4 bg-muted/30 dark:bg-background dark:bg-linear-to-b dark:from-accent/50 dark:to-accent/10">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How KlasMwen Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Getting started is simple and free
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <StepCard key={step.step} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiscoverHowItWorks;
