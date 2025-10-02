import type { PostType } from "@/zodSchemas/post.zod";

const getFormTitle = (postType: PostType | null) => {
  switch (postType) {
    case "QUESTION":
      return "Ask a Question";
    case "NOTE":
      return "Create a Note";
    case "RESOURCE":
      return "Share a Resource";
    default:
      return "Create Post";
  }
};

const getFormDescription = (postType: PostType | null) => {
  switch (postType) {
    case "QUESTION":
      return "Share your question with the community and get helpful answers.";
    case "NOTE":
      return "Document your knowledge and insights to help others learn.";
    case "RESOURCE":
      return "Upload a file or document to share with the community.";
    default:
      return "";
  }
};

export { getFormTitle, getFormDescription };
