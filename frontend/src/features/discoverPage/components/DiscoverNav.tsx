import { Link } from "react-router-dom";

import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

const DiscoverNav = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          <BookOpen className="w-6 h-6" />
          KlasMwen
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default DiscoverNav;
