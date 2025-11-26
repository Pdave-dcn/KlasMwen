import { Link } from "react-router-dom";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const LandingCTA = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
      <Link to="/register">
        <Button
          size="lg"
          className="text-lg px-8 py-4 h-auto font-semibold cursor-pointer"
        >
          Join the Community
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </Link>
      <Link to="/discover">
        <Button
          size="lg"
          variant="secondary"
          className="text-lg px-8 py-4 h-auto font-semibold cursor-pointer"
        >
          Discover KlasMwen
        </Button>
      </Link>
    </div>
  );
};

export default LandingCTA;
