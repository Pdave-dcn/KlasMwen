import type { Post } from "@/zodSchemas/post.zod";

import EmptyState from "./EmptyState";
import InitialState from "./InitialState";
import LoadingSkeleton from "./LoadingSkeleton";
import SearchResults from "./SearchResults";

interface SearchContentProps {
  isLoading: boolean;
  hasActiveFilters: string | boolean;
  posts: Post[];
  debouncedQuery: string;
  totalResults: number;
  selectedTags: string[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const SearchContent = ({
  isLoading,
  hasActiveFilters,
  posts,
  debouncedQuery,
  totalResults,
  selectedTags,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: SearchContentProps) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (hasActiveFilters && posts.length === 0) {
    return <EmptyState query={debouncedQuery} />;
  }

  if (posts.length > 0) {
    return (
      <SearchResults
        posts={posts}
        totalResults={totalResults}
        debouncedQuery={debouncedQuery}
        selectedTags={selectedTags}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
      />
    );
  }

  if (!hasActiveFilters) {
    return <InitialState />;
  }

  return null;
};

export default SearchContent;
