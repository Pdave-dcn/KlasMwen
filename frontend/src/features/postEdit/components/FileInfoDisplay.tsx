import { Label } from "@/components/ui/label";
import type { PostEdit } from "@/zodSchemas/post.zod";

export const FileInfoDisplay = ({ post }: { post: PostEdit }) => {
  if (!post.fileName) return null;

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Attached File</Label>
      <div className="p-3 rounded-md border">
        <p className="text-sm font-medium">{post.fileName}</p>
        {post.fileSize && (
          <p className="text-xs mt-1">
            Size: {(post.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>
      <p className="text-xs">File cannot be changed when editing a post</p>
    </div>
  );
};
