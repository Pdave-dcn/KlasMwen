import { MessageCircle } from "lucide-react";

const CommentsEmpty = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
    <h3 className="font-medium text-lg mb-2">No comments yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Be the first to share your thoughts on this post!
    </p>
  </div>
);

export default CommentsEmpty;
