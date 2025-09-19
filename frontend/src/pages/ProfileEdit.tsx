import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";

import AvatarModal from "@/components/AvatarModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useProfileUser as useGetActiveUserInfo } from "@/queries/useProfile";
import { useUpdateUserInfo } from "@/queries/useUserMutation";
import formatMemberSince from "@/utils/userCreationDateFormatter";
import { UpdateProfileSchema } from "@/zodSchemas/user.zod";

type FormData = {
  bio: string;
  avatarId: number;
  twitter: string;
  instagram: string;
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState, setValue, reset } =
    useForm<FormData>({
      resolver: zodResolver(UpdateProfileSchema),
    });
  const { errors } = formState;

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState("");

  const { data: user, isLoading, error } = useGetActiveUserInfo(undefined);

  useEffect(() => {
    if (user) {
      reset({
        bio: user.bio ?? "",
        avatarId: user.avatar?.id,
      });

      if (user.avatar) {
        setCurrentAvatarUrl(user.avatar.url);
      }
    }
  }, [user, reset]);

  const handleSelectAvatar = (avatarId: number, avatarUrl: string) => {
    setCurrentAvatarUrl(avatarUrl);
    setValue("avatarId", avatarId, { shouldValidate: true });
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalOpen(false);
  };

  const handleCancel = async () => {
    await navigate("/profile/me", { replace: true });
  };

  const mutation = useUpdateUserInfo();

  const onSubmit = async (data: FormData) => {
    mutation.mutate(data);
    await navigate("/profile/me");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-accent/50">
      <Card className="w-full max-w-2xl mb-4">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
        </CardHeader>

        {isLoading ? (
          <CardContent className="flex items-center justify-center">
            <Spinner />
          </CardContent>
        ) : error ? (
          <CardContent className="flex items-center justify-center">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load user. Please try again later.
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <CardContent className="flex flex-col gap-5">
            {/* Avatar Section */}
            <div className="flex justify-between items-center bg-accent p-3 md:p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 md:w-16 md:h-16">
                  <AvatarImage src={currentAvatarUrl} />
                  <AvatarFallback>
                    {user?.username
                      ? user.username.slice(0, 2).toUpperCase()
                      : ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg md:text-xl font-bold">
                    @{user?.username}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formatMemberSince(user?.createdAt ?? "")}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsAvatarModalOpen(true)}
                className="cursor-pointer"
              >
                <span className="md:hidden">
                  <Pencil className="w-4 h-4" />
                </span>
                <span className="hidden md:inline">Change Avatar</span>
              </Button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <Input type="hidden" id="avatarId" {...register("avatarId")} />

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

              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media</h3>

                <div className="flex flex-col gap-4">
                  <div>
                    <Label
                      htmlFor="twitter"
                      className="text-sm font-medium mb-2"
                    >
                      Twitter/X Username
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        @
                      </span>
                      <Input
                        id="twitter"
                        {...register("twitter")}
                        placeholder="username"
                        className={`pl-7 ${
                          errors.twitter ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.twitter && (
                      <Alert variant="destructive" className="py-2 mt-1">
                        <AlertDescription className="text-sm">
                          {errors.twitter.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="instagram"
                      className="text-sm font-medium mb-2"
                    >
                      Instagram Username
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        @
                      </span>
                      <Input
                        id="instagram"
                        {...register("instagram")}
                        placeholder="username"
                        className={`pl-7 ${
                          errors.instagram ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.instagram && (
                      <Alert variant="destructive" className="py-2 mt-1">
                        <AlertDescription className="text-sm">
                          {errors.instagram.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1 cursor-pointer">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Avatar selection */}
      {isAvatarModalOpen && (
        <AvatarModal
          isOpen={isAvatarModalOpen}
          onClose={handleCloseAvatarModal}
          onConfirmation={handleSelectAvatar}
          currentAvatarUrl={currentAvatarUrl}
        />
      )}
    </div>
  );
};

export default ProfileEdit;
