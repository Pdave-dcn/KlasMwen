import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PostType } from "@/zodSchemas/post.zod";

import { getFormDescription, getFormTitle } from "../../helpers";

interface PostCreationDialogHeaderProps {
  postType: PostType;
}

export const PostCreationDialogHeader = ({
  postType,
}: PostCreationDialogHeaderProps) => (
  <DialogHeader>
    <DialogTitle className="text-2xl font-bold">
      {getFormTitle(postType)}
    </DialogTitle>
    <DialogDescription>{getFormDescription(postType)}</DialogDescription>
  </DialogHeader>
);
