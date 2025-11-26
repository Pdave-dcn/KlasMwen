import { Button } from "@/components/ui/button";

interface ProfileEditActionsProps {
  onCancel: () => void;
}

const ProfileEditActions = ({ onCancel }: ProfileEditActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <Button type="submit" className="flex-1 cursor-pointer">
        Save Changes
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex-1 cursor-pointer"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </div>
  );
};

export default ProfileEditActions;
