import { Link } from "react-router-dom";

import {
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  Share2,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  BookMarked,
  Upload,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const DiscoverPage = () => {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background">
      {/* Header/Navigation */}
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

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-linear-to-b from-primary/10 dark:from-primary/20 to-accent/5 dark:to-accent/15">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              By Students, For Students
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to KlasMwen
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            <span className="font-semibold text-foreground">KlasMwen</span>{" "}
            (from Haitian Creole "<em>klas mwen</em>", meaning "
            <em>my class</em>") is an educational social platform designed for
            students to connect, collaborate, and grow together.
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Makes KlasMwen Special?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete learning ecosystem built to support your academic
              journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ask & Answer</h3>
              <p className="text-muted-foreground">
                Get help from peers and share your knowledge. Ask questions and
                receive thoughtful answers from fellow students who understand
                your challenges.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Notes</h3>
              <p className="text-muted-foreground">
                Create and share study notes, tips, and learning resources. Help
                others while reinforcing your own understanding.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Resources</h3>
              <p className="text-muted-foreground">
                Share PDFs, Excel sheets, and eBooks. Build a collective library
                of educational materials accessible to everyone.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Community</h3>
              <p className="text-muted-foreground">
                Connect with students who share your interests and academic
                goals. Learn together and support each other's growth.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Content</h3>
              <p className="text-muted-foreground">
                Find exactly what you need with powerful search and filtering.
                Explore posts, notes, and resources by topic or tag.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookMarked className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save for Later</h3>
              <p className="text-muted-foreground">
                Bookmark helpful posts and resources. Build your personal
                library of go-to study materials for quick reference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
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
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-muted-foreground">
                Sign up for free with just your email. No credit card required,
                no hidden fees.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Explore & Contribute
              </h3>
              <p className="text-muted-foreground">
                Browse content, ask questions, share notes, and upload resources
                that help others.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Learn Together</h3>
              <p className="text-muted-foreground">
                Engage with the community, react to posts, comment, and grow
                your knowledge together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built with Students in Mind
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Free Forever</h3>
              <p className="text-sm text-muted-foreground">
                No subscriptions, no paywalls. Education should be accessible to
                all.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Safe & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Student-friendly environment with privacy and safety as top
                priorities.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Collaborative</h3>
              <p className="text-sm text-muted-foreground">
                Learn better together. Share knowledge and grow as a community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <footer className="border-t bg-linear-to-r from-muted/20 to-muted/40 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-primary">KlasMwen</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Empowering students with collaborative learning experiences and
              meaningful connections.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Support Center
              </Link>
              <Link
                to="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                About Us
              </Link>
            </div>
            <div className="text-sm text-muted-foreground/80 pt-4 border-t border-muted-foreground/20">
              © {currentYear} KlasMwen. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default DiscoverPage;
