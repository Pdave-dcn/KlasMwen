import { authSchemas } from "./auth.schema.js";
import { avatarSchemas } from "./avatar.schema.js";
import { commentSchemas } from "./comment.schema.js";
import { commonSchemas } from "./common.schema.js";
import { postSchemas } from "./post.schema.js";
import { reportSchemas } from "./report.schema.js";
import { searchSchemas } from "./search.schema.js";
import { tagSchemas } from "./tag.schema.js";
import { userSchemas } from "./user.schema.js";

export const allSchemas = {
  ...commonSchemas,
  ...commentSchemas,
  ...authSchemas,
  ...userSchemas,
  ...postSchemas,
  ...tagSchemas,
  ...avatarSchemas,
  ...searchSchemas,
  ...reportSchemas,
};
