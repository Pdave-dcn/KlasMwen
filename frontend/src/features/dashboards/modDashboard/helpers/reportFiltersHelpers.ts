const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "DISMISSED", label: "Dismissed" },
];

const resourceTypeOptions = [
  { value: "all", label: "All Resource Types" },
  { value: "post", label: "Post" },
  { value: "comment", label: "Comment" },
];

// Prevent timezone shifting by constructing a local date
const parseLocalDate = (str: string) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export { statusOptions, resourceTypeOptions, parseLocalDate };
