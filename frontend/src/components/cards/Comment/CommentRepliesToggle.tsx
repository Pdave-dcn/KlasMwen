interface CommentRepliesToggleProps {
  totalReplies: number;
  isOpen: boolean;
  onToggle: () => void;
}

const CommentRepliesToggle = ({
  totalReplies,
  isOpen,
  onToggle,
}: CommentRepliesToggleProps) => {
  if (totalReplies === 0) return null;

  return (
    <div className="mt-4">
      <button
        className="text-xs text-muted-foreground flex items-center gap-4 hover:cursor-pointer"
        onClick={onToggle}
      >
        <span className="h-px w-10 bg-muted-foreground" />
        <span className="hover:underline">
          {isOpen ? "Hide replies" : `View replies (${totalReplies})`}
        </span>
      </button>
    </div>
  );
};

export default CommentRepliesToggle;
