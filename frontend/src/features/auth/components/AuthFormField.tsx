import type { ReactNode } from "react";

import type { UseFormRegister } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormData } from "@/types/form.type";

interface AuthFieldProps {
  id: "username" | "password" | "email";
  label: string;
  type?: string;
  icon: ReactNode;
  error?: string;
  register: UseFormRegister<FormData>;
  placeholder?: string;
  rightElement?: ReactNode;
}

const AuthField = ({
  id,
  label,
  type = "text",
  icon,
  error,
  register,
  placeholder,
  rightElement,
}: AuthFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">
      {label}
    </Label>
    <div className="relative">
      <span className="absolute left-3 top-3">{icon}</span>
      <Input
        id={id}
        type={type}
        {...register(id)}
        placeholder={placeholder}
        className={`pl-10 ${rightElement ? "pr-10" : ""} ${
          error ? "border-red-500 focus-visible:ring-red-500" : ""
        }`}
      />
      {rightElement}
    </div>
    {error && (
      <Alert variant="destructive" className="py-2">
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    )}
  </div>
);

export default AuthField;
