import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PostEditDialogHeaderProps {
  isResourcePost: boolean;
}

export const PostEditDialogHeader = ({
  isResourcePost,
}: PostEditDialogHeaderProps) => (
  <DialogHeader>
    <DialogTitle className="text-2xl font-bold">Edit Post</DialogTitle>
    <DialogDescription>
      {isResourcePost
        ? "Update the post title and tags below."
        : "Update the post content and tags below."}
    </DialogDescription>
  </DialogHeader>
);
