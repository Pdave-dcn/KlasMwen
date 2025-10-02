import { HelpCircle, FileText, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PostType } from "@/zodSchemas/post.zod";

interface PostTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: PostType) => void;
}

const PostTypeSelector = ({
  open,
  onClose,
  onSelect,
}: PostTypeSelectorProps) => {
  const postTypes = [
    {
      type: "QUESTION" as PostType,
      title: "Question",
      description: "Ask the community for help or insights",
      icon: HelpCircle,
    },
    {
      type: "NOTE" as PostType,
      title: "Note",
      description: "Share knowledge, tips, or interesting findings",
      icon: FileText,
    },
    {
      type: "RESOURCE" as PostType,
      title: "Resource",
      description: "Upload files, documents, or media to share",
      icon: Upload,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            What would you like to create?
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose the type of post you want to share with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 //py-4">
          {postTypes.map((postType) => {
            const Icon = postType.icon;
            return (
              <button
                key={postType.type}
                className="h-auto p-2 rounded-xl  flex flex-col items-center cursor-pointer transition-all duration-300 border-2 hover:bg-muted hover:border-primary/20"
                onClick={() => onSelect(postType.type)}
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{postType.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {postType.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostTypeSelector;
