import { Link } from "react-router-dom";

import { BookOpen } from "lucide-react";

const DiscoverFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
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
  );
};

export default DiscoverFooter;
