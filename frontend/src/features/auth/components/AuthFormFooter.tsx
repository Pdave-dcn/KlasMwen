import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const AuthFooter = ({
  currentForm,
  switchForm,
}: {
  currentForm: "signin" | "signup";
  switchForm: (formType: "signin" | "signup") => void;
}) => (
  <div className="flex flex-col space-y-4 pt-4">
    <Separator />
    <div className="text-sm text-muted-foreground">
      {currentForm === "signin"
        ? "Don't have an account?"
        : "Already have an account?"}
      <Button
        variant="link"
        className="px-2 text-primary hover:underline font-medium cursor-pointer"
        onClick={() =>
          switchForm(currentForm === "signin" ? "signup" : "signin")
        }
      >
        {currentForm === "signin" ? "Sign up" : "Sign in"}
      </Button>
    </div>
  </div>
);

export default AuthFooter;
