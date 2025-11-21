import { useQuery } from "@tanstack/react-query";

import { getPopularTags, getTags } from "@/api/tag.api";

const useTagQuery = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });
};

const usePopularTagsQuery = () => {
  return useQuery({
    queryKey: ["tags", "popular"],
    queryFn: getPopularTags,
  });
};

export { useTagQuery, usePopularTagsQuery };
