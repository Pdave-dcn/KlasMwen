import PostCard from "@/components/cards/post/PostCard";
import LoadMoreButton from "@/components/LoadMoreButton";
import type { Post } from "@/zodSchemas/post.zod";

interface SearchResultsProps {
  posts: Post[];
  totalResults: number;
  debouncedQuery: string;
  selectedTags: string[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const SearchResults = ({
  posts,
  totalResults,
  debouncedQuery,
  selectedTags,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: SearchResultsProps) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Found {totalResults} result{totalResults !== 1 ? "s" : ""}
      {debouncedQuery && ` for "${debouncedQuery}"`}
      {selectedTags.length > 0 &&
        ` with ${selectedTags.length} tag${
          selectedTags.length !== 1 ? "s" : ""
        }`}
    </p>

    {posts.map((post) => (
      <PostCard key={post.id} post={post} />
    ))}

    {hasNextPage && (
      <div className="flex justify-center">
        <LoadMoreButton
          isLoading={isFetchingNextPage}
          onClick={onLoadMore}
          variant="ghost"
        />
      </div>
    )}
  </div>
);

export default SearchResults;
