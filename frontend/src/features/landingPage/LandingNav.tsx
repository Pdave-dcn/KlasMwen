import { Link } from "react-router-dom";

import { BookOpen } from "lucide-react";

const LandingNav = () => {
  return (
    <nav className="flex justify-between items-center px-6 md:px-8 mb-16">
      <Link
        to="/"
        className="flex items-center gap-2 text-lg md:text-2xl font-bold text-white z-10"
      >
        <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
        KlasMwen
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/register"
          className="text-white font-medium underline md:no-underline z-10"
        >
          Join now
        </Link>

        <Link
          to="/sign-in"
          className="text-white font-medium underline md:no-underline md:border-2 md:border-white/30 md:rounded-full md:px-3 md:py-1 md:h-auto lg:px-6 lg:py-2 inline-block z-10"
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
};

export default LandingNav;
