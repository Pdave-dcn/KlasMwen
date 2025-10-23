import { useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";

import { ArrowRight, BookOpen, CheckCircle, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate("/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const currentYear = new Date().getFullYear();
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent py-10 text-center relative overflow-hidden">
        <nav className="flex justify-between items-center px-6 md:px-8 mb-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg md:text-2xl font-bold text-white z-10"
          >
            <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
            Klasmwen
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

        <div className="absolute inset-0 bg-black/20 dark:bg-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Your Study Journey
                <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Starts Here
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Connect with fellow students, share knowledge, and accelerate
                your learning with the most engaging academic social platform.
              </p>
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
                <Link to="#">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-4 h-auto font-semibold cursor-pointer"
                  >
                    Discover KlasMwen
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Free Forever
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safe & Student-Friendly
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Stronger Together
                </div>
              </div>
            </div>
          </div>
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-xl" />
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-white rounded-full blur-xl" />
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full blur-lg" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-r from-muted/20 to-muted/40 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
              <h3 className="text-3xl font-bold text-primary">KlasMwen</h3>
            </div>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed">
              Empowering students worldwide with collaborative learning
              experiences and meaningful connections.
            </p>
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium hover:underline"
              >
                Privacy Policy
              </Link>
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium hover:underline"
              >
                Support Center
              </Link>
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium hover:underline"
              >
                About Us
              </Link>
            </div>
            <div className="text-sm text-muted-foreground/80 pt-6 border-t border-muted-foreground/20">
              © {currentYear} KlasMwen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
