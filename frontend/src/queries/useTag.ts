import { useQuery } from "@tanstack/react-query";

import { getTags } from "@/api/tag.api";

const useTagQuery = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
  });
};

export { useTagQuery };
