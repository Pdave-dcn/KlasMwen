import type { UseFormRegister, FieldErrors } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormData = {
  bio: string;
  avatarId: number;
  twitter: string;
  instagram: string;
};

interface ProfileEditBioFieldProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const ProfileEditBioField = ({
  register,
  errors,
}: ProfileEditBioFieldProps) => {
  return (
    <div>
      <Label htmlFor="bio" className="text-lg">
        Bio
      </Label>
      <Textarea
        id="bio"
        {...register("bio")}
        placeholder="Tell us about yourself..."
        rows={4}
        className={`resize-none overflow-y-auto max-h-[110px] ${
          errors.bio ? "border-red-500" : ""
        }`}
      />
      {errors.bio && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">
            {errors.bio.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProfileEditBioField;
