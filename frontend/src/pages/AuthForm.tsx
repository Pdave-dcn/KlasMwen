import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  ArrowRight,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthMutation } from "@/queries/useAuthMutation";
import type { FormData, FormType } from "@/types/form.type";
import { RegisterSchema, SignInSchema } from "@/zodSchemas/auth.zod";

const AuthForm = ({ defaultMode = "signin" }: { defaultMode?: FormType }) => {
  const [currentForm, setCurrentForm] = useState(defaultMode);
  const [showPassword, setShowPassword] = useState(false);

  const schema = currentForm === "signin" ? SignInSchema : RegisterSchema;

  const { register, handleSubmit, formState, reset, setError } =
    useForm<FormData>({
      resolver: zodResolver(schema),
    });
  const { errors } = formState;

  const mutation = useAuthMutation(currentForm, setError);

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const switchForm = (formType: FormType) => {
    setCurrentForm(formType);
    setShowPassword(false);
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary rounded-xl">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary">KlasMwen</h1>
          </div>
          <p className="text-muted-foreground">
            {currentForm === "signin" ? "Welcome back!" : "Join the community"}
          </p>
        </div>

        <Card className="shadow-lg backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-semibold">
              {currentForm === "signin" ? "Sign In" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {currentForm === "signin"
                ? "Enter your credentials to access your account"
                : "Fill in your details to get started"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {currentForm === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        {...register("username")}
                        placeholder="Choose a username"
                        className={`pl-10 ${
                          "username" in errors && errors.username
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />
                    </div>
                    {"username" in errors && errors.username && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">
                          {errors.username.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      {...register("email")}
                      placeholder="Enter your email"
                      className={`pl-10 ${
                        errors.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {errors.email.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={`pl-10 pr-10 ${
                        errors.password
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-sm">
                        {errors.password.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {currentForm === "signin" && (
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      className="px-0 text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-6 h-11 text-base font-medium cursor-pointer"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {currentForm === "signin"
                        ? "Signing in..."
                        : "Creating account..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {currentForm === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Separator />
            <div className="text-center text-sm text-muted-foreground">
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
          </CardFooter>
        </Card>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
