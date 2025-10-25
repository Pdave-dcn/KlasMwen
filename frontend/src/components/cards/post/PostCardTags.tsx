import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/zodSchemas/tag.zod";

interface PostCardTagsProps {
  tags: Tag[];
}

const PostCardTags = ({ tags }: PostCardTagsProps) => {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="text-xs border">
          {tag.name}
        </Badge>
      ))}
    </div>
  );
};

export default PostCardTags;
