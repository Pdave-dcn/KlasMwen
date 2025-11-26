import { Link } from "react-router-dom";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const DiscoverCTA = () => {
  return (
    <section className="py-20 px-4 bg-linear-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to Join Your Classmates?
        </h2>
        <p className="text-xl mb-8 text-primary-foreground/90">
          Start your learning journey with KlasMwen today. It's free, forever.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-4 h-auto font-semibold"
            >
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link to="/sign-in">
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 h-auto font-semibold bg-transparent border-2 dark:border-foreground dark:bg-transparent dark:hover:bg-background dark:hover:text-foreground dark:hover:border-background transition-colors"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DiscoverCTA;
