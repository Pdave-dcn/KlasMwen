import { Link } from "react-router-dom";

import { BookOpen } from "lucide-react";

const AuthHeader = ({ currentForm }: { currentForm: "signin" | "signup" }) => (
  <div className="text-center mb-8">
    <div className="flex items-center justify-center mb-4">
      <Link to="/" className="flex gap-2">
        <div className="p-2 bg-primary rounded-xl">
          <BookOpen className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-primary">KlasMwen</h1>
      </Link>
    </div>
    <p className="text-muted-foreground">
      {currentForm === "signin" ? "Welcome back!" : "Join the community"}
    </p>
  </div>
);

export default AuthHeader;
