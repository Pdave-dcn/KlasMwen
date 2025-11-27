import AvatarModal from "@/components/modals/AvatarModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import ProfileEditActions from "@/features/profileEdit/components/ProfileEditActions";
import ProfileEditAvatar from "@/features/profileEdit/components/ProfileEditAvatar";
import ProfileEditBioField from "@/features/profileEdit/components/ProfileEditBioField";
import ProfileEditSocialSection from "@/features/profileEdit/components/ProfileEditSocialSection";
import { useProfileEdit } from "@/features/profileEdit/hooks/useProfileEdit";

const ProfileEdit = () => {
  const {
    user,
    isLoading,
    error,
    currentAvatarUrl,
    isAvatarModalOpen,
    register,
    errors,
    handlers,
  } = useProfileEdit();

  return (
    <main className="flex justify-center items-center h-screen">
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
            <ProfileEditAvatar
              username={user?.username ?? ""}
              avatarUrl={currentAvatarUrl}
              createdAt={user?.createdAt ?? ""}
              onOpenModal={handlers.handleOpenAvatarModal}
            />

            <form
              onSubmit={handlers.handleSubmit}
              className="flex flex-col gap-4"
            >
              <Input type="hidden" id="avatarId" {...register("avatarId")} />

              <ProfileEditBioField register={register} errors={errors} />

              <ProfileEditSocialSection register={register} errors={errors} />

              <ProfileEditActions onCancel={handlers.handleCancel} />
            </form>
          </CardContent>
        )}
      </Card>

      {isAvatarModalOpen && (
        <AvatarModal
          isOpen={isAvatarModalOpen}
          onClose={handlers.handleCloseAvatarModal}
          onConfirmation={handlers.handleSelectAvatar}
          currentAvatarUrl={currentAvatarUrl}
        />
      )}
    </main>
  );
};

export default ProfileEdit;
