import type { UseFormRegister, FieldErrors } from "react-hook-form";

import ProfileEditSocialField from "./ProfileEditSocialField";

type FormData = {
  bio: string;
  avatarId: number;
  twitter: string;
  instagram: string;
};

interface ProfileEditSocialSectionProps {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
}

const ProfileEditSocialSection = ({
  register,
  errors,
}: ProfileEditSocialSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Social Media</h3>
      <div className="flex flex-col gap-4">
        <ProfileEditSocialField
          id="twitter"
          label="Twitter/X Username"
          register={register}
          errors={errors}
        />
        <ProfileEditSocialField
          id="instagram"
          label="Instagram Username"
          register={register}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default ProfileEditSocialSection;
