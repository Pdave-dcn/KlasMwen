import MarkdownPreview from "@uiw/react-markdown-preview";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";

import "@uiw/react-markdown-preview/markdown.css";
import type { Post } from "@/zodSchemas/post.zod";

interface PostCardContentProps {
  post: Post;
}

const PostCardContent = ({ post }: PostCardContentProps) => {
  return (
    <>
      <h2 className="text-lg font-semibold leading-tight">{post.title}</h2>

      {post.content && (
        <div className="prose prose-neutral //max-w-none">
          <MarkdownPreview
            style={{ backgroundColor: "transparent" }}
            source={post.content}
            rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          />
        </div>
      )}

      {post.fileUrl && post.fileName && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <div className="w-4 h-4 bg-primary/20 rounded" />
          <span className="text-sm text-muted-foreground">{post.fileName}</span>
        </div>
      )}
    </>
  );
};

export default PostCardContent;
