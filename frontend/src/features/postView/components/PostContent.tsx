import MarkdownPreview from "@uiw/react-markdown-preview";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";

import { CardContent } from "@/components/ui/card";
import "@uiw/react-markdown-preview/markdown.css";
import type { LessExtendedPost } from "@/zodSchemas/post.zod";

import FileAttachment from "./FileAttachment";

interface PostContentProps {
  post: LessExtendedPost;
}

const PostContent = ({ post }: PostContentProps) => {
  return (
    <CardContent className="space-y-6">
      {post.content && (
        <div className="prose prose-neutral max-w-none">
          <MarkdownPreview
            style={{ backgroundColor: "transparent" }}
            source={post.content}
            rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          />
        </div>
      )}

      {post.fileUrl && <FileAttachment post={post} />}
    </CardContent>
  );
};

export default PostContent;
