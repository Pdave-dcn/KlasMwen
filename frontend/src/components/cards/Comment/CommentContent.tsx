interface CommentContentProps {
  content: string;
}

const CommentContent = ({ content }: CommentContentProps) => {
  return <p className="text-sm leading-relaxed">{content}</p>;
};

export default CommentContent;
