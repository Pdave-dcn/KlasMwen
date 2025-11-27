import { Link } from "react-router-dom";

import { BookOpen } from "lucide-react";

const footerLinks = [
  { to: "#", text: "Privacy Policy" },
  { to: "#", text: "Terms of Service" },
  { to: "#", text: "Support Center" },
  { to: "#", text: "About Us" },
];

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-linear-to-r from-muted/20 to-muted/40 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
            <h3 className="text-3xl font-bold text-primary">KlasMwen</h3>
          </div>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed">
            Empowering students with collaborative learning experiences and
            meaningful connections.
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {footerLinks.map((link) => (
              <Link
                key={link.text}
                to={link.to}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium hover:underline"
              >
                {link.text}
              </Link>
            ))}
          </div>
          <div className="text-sm text-muted-foreground/80 pt-6 border-t border-muted-foreground/20">
            © {currentYear} KlasMwen. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
