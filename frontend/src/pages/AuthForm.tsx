import { useState } from "react";

import { useForm, type FieldErrors } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, User, Lock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import AuthField from "@/features/auth/components/AuthFormField";
import AuthFooter from "@/features/auth/components/AuthFormFooter";
import AuthHeader from "@/features/auth/components/AuthFormHeader";
import { useAuthMutation } from "@/queries/useAuthMutation";
import type { FormData, FormType, RegisterData } from "@/types/form.type";
import { RegisterSchema, SignInSchema } from "@/zodSchemas/auth.zod";

const AuthForm = ({ defaultMode = "signin" }: { defaultMode?: FormType }) => {
  const [currentForm, setCurrentForm] = useState<FormType>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);

  const schema = currentForm === "signin" ? SignInSchema : RegisterSchema;
  const { register, handleSubmit, formState, reset, setError } =
    useForm<FormData>({
      resolver: zodResolver(schema),
    });
  const { errors } = formState;

  const mutation = useAuthMutation(currentForm, setError);

  const onSubmit = (data: FormData) => mutation.mutate(data);
  const switchForm = (formType: FormType) => {
    setCurrentForm(formType);
    setShowPassword(false);
    reset();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="w-full max-w-md">
        <AuthHeader currentForm={currentForm} />

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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {currentForm === "signup" && (
                <AuthField
                  id="username"
                  label="Username"
                  icon={<User className="w-4 h-4 text-muted-foreground" />}
                  placeholder="Choose a username"
                  error={
                    (errors as FieldErrors<RegisterData>).username?.message
                  }
                  register={register}
                />
              )}

              <AuthField
                id="email"
                label="Email"
                icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                placeholder="Enter your email"
                error={errors.email?.message}
                register={register}
              />

              <AuthField
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                icon={<Lock className="w-4 h-4 text-muted-foreground" />}
                placeholder="Enter your password"
                error={errors.password?.message}
                register={register}
                rightElement={
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
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                }
              />

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
                )}{" "}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <AuthFooter currentForm={currentForm} switchForm={switchForm} />
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
    </main>
  );
};

export default AuthForm;
