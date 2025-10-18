import { Search } from "lucide-react";

interface EmptyStateProps {
  query: string;
}

const EmptyState = ({ query }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">No results found</h3>
      <p className="max-w-md text-muted-foreground">
        We couldn't find any posts matching{" "}
        <span className="font-medium text-foreground">"{query}"</span>. Try
        different keywords or tags.
      </p>
    </div>
  );
};

export default EmptyState;
