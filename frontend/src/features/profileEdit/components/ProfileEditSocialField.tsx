import type { UseFormRegister, FieldErrors } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  bio: string;
  avatarId: number;
  twitter: string;
  instagram: string;
};

interface ProfileEditSocialFieldProps {
  id: "twitter" | "instagram";
  label: string;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const ProfileEditSocialField = ({
  id,
  label,
  register,
  errors,
}: ProfileEditSocialFieldProps) => {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium mb-2">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          @
        </span>
        <Input
          id={id}
          {...register(id)}
          placeholder="username"
          className={`pl-7 ${errors[id] ? "border-red-500" : ""}`}
        />
      </div>
      {errors[id] && (
        <Alert variant="destructive" className="py-2 mt-1">
          <AlertDescription className="text-sm">
            {errors[id]?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfileEditSocialField;
