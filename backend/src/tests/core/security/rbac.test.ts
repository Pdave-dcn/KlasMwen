import { describe, it, expect, beforeEach, vi } from "vitest";

import { AuthorizationError } from "../../../core/error/custom/auth.error";
import { hasPermission, assertPermission } from "../../../core/security/rbac";

import type { Role } from "@prisma/client";

describe("hasPermission", () => {
  // Helper to create mock users
  const createUser = (id: string, role: Role): Express.User => ({
    id,
    role,
    email: `${id}@test.com`,
    username: "User",
  });

  // Helper to create mock post data
  const createPost = (id: string, authorId: string) => ({
    id,
    authorId,
  });

  // Helper to create mock comment data
  const createComment = (id: number, authorId: string) => ({
    id,
    authorId,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("boolean permissions", () => {
    it("should return true for ADMIN creating a post", () => {
      const user = createUser("admin-1", "ADMIN");

      const result = hasPermission(user, "posts", "create");

      expect(result).toBe(true);
    });

    it("should return true for STUDENT reading a post", () => {
      const user = createUser("student-1", "STUDENT");

      const result = hasPermission(user, "posts", "read");

      expect(result).toBe(true);
    });

    it("should return true for MODERATOR deleting a comment", () => {
      const user = createUser("mod-1", "MODERATOR");

      const result = hasPermission(user, "comments", "delete");

      expect(result).toBe(true);
    });

    it("should return false for undefined permission", () => {
      const user = createUser("student-1", "STUDENT");

      const result = hasPermission(user, "posts", "invalidAction" as any);

      expect(result).toBe(false);
    });

    it("should return false for undefined resource", () => {
      const user = createUser("student-1", "STUDENT");

      const result = hasPermission(user, "invalidResource" as any, "create");

      expect(result).toBe(false);
    });

    it("should return false for undefined role", () => {
      const user = createUser("user-1", "INVALID_ROLE" as Role);

      const result = hasPermission(user, "posts", "create");

      expect(result).toBe(false);
    });
  });

  describe("function permissions with data", () => {
    describe("ADMIN role", () => {
      it("should allow ADMIN to report post they did not author", () => {
        const user = createUser("admin-1", "ADMIN");
        const post = createPost("post-1", "other-user");

        const result = hasPermission(user, "posts", "report", post);

        expect(result).toBe(true);
      });

      it("should prevent ADMIN from reporting their own post", () => {
        const user = createUser("admin-1", "ADMIN");
        const post = createPost("post-1", "admin-1");

        const result = hasPermission(user, "posts", "report", post);

        expect(result).toBe(false);
      });

      it("should allow ADMIN to report comment they did not author", () => {
        const user = createUser("admin-1", "ADMIN");
        const comment = createComment(123, "other-user");

        const result = hasPermission(user, "comments", "report", comment);

        expect(result).toBe(true);
      });
    });

    describe("MODERATOR role", () => {
      it("should allow MODERATOR to update their own post", () => {
        const user = createUser("mod-1", "MODERATOR");
        const post = createPost("post-1", "mod-1");

        const result = hasPermission(user, "posts", "update", post);

        expect(result).toBe(true);
      });

      it("should prevent MODERATOR from updating another user's post", () => {
        const user = createUser("mod-1", "MODERATOR");
        const post = createPost("post-1", "other-user");

        const result = hasPermission(user, "posts", "update", post);

        expect(result).toBe(false);
      });

      it("should allow MODERATOR to update their own comment", () => {
        const user = createUser("mod-1", "MODERATOR");
        const comment = createComment(456, "mod-1");

        const result = hasPermission(user, "comments", "update", comment);

        expect(result).toBe(true);
      });

      it("should prevent MODERATOR from updating another user's comment", () => {
        const user = createUser("mod-1", "MODERATOR");
        const comment = createComment(456, "other-user");

        const result = hasPermission(user, "comments", "update", comment);

        expect(result).toBe(false);
      });
    });

    describe("STUDENT role", () => {
      it("should allow STUDENT to update their own post", () => {
        const user = createUser("student-1", "STUDENT");
        const post = createPost("post-1", "student-1");

        const result = hasPermission(user, "posts", "update", post);

        expect(result).toBe(true);
      });

      it("should prevent STUDENT from updating another user's post", () => {
        const user = createUser("student-1", "STUDENT");
        const post = createPost("post-1", "other-user");

        const result = hasPermission(user, "posts", "update", post);

        expect(result).toBe(false);
      });

      it("should allow STUDENT to delete their own post", () => {
        const user = createUser("student-1", "STUDENT");
        const post = createPost("post-1", "student-1");

        const result = hasPermission(user, "posts", "delete", post);

        expect(result).toBe(true);
      });

      it("should prevent STUDENT from deleting another user's post", () => {
        const user = createUser("student-1", "STUDENT");
        const post = createPost("post-1", "other-user");

        const result = hasPermission(user, "posts", "delete", post);

        expect(result).toBe(false);
      });

      it("should allow STUDENT to delete their own comment", () => {
        const user = createUser("student-1", "STUDENT");
        const comment = createComment(789, "student-1");

        const result = hasPermission(user, "comments", "delete", comment);

        expect(result).toBe(true);
      });

      it("should prevent STUDENT from reporting their own post", () => {
        const user = createUser("student-1", "STUDENT");
        const post = createPost("post-1", "student-1");

        const result = hasPermission(user, "posts", "report", post);

        expect(result).toBe(false);
      });

      it("should allow STUDENT to report another user's comment", () => {
        const user = createUser("student-1", "STUDENT");
        const comment = createComment(999, "other-user");

        const result = hasPermission(user, "comments", "report", comment);

        expect(result).toBe(true);
      });
    });
  });

  describe("function permissions without data", () => {
    it("should return false when permission is a function but no data provided", () => {
      const user = createUser("student-1", "STUDENT");

      const result = hasPermission(user, "posts", "update");

      expect(result).toBe(false);
    });

    it("should return false for MODERATOR update without data", () => {
      const user = createUser("mod-1", "MODERATOR");

      const result = hasPermission(user, "posts", "update");

      expect(result).toBe(false);
    });

    it("should return false for STUDENT delete without data", () => {
      const user = createUser("student-1", "STUDENT");

      const result = hasPermission(user, "comments", "delete");

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle post with nested author object", () => {
      const user = createUser("student-1", "STUDENT");
      const post = {
        id: "post-1",
        author: { id: "student-1" },
      };

      const result = hasPermission(user, "posts", "update", post as any);

      expect(result).toBe(true);
    });

    it("should handle comment with nested author object", () => {
      const user = createUser("student-1", "STUDENT");
      const comment = {
        id: 123,
        author: { id: "other-user" },
      };

      const result = hasPermission(user, "comments", "delete", comment as any);

      expect(result).toBe(false);
    });

    it("should handle undefined authorId gracefully", () => {
      const user = createUser("student-1", "STUDENT");
      const post = { id: "post-1" };

      const result = hasPermission(user, "posts", "update", post as any);

      expect(result).toBe(false);
    });
  });
});

describe("assertPermission", () => {
  const createUser = (id: string, role: Role): Express.User => ({
    id,
    role,
    email: `${id}@test.com`,
    username: "User",
  });

  const createPost = (id: string, authorId: string) => ({
    id,
    authorId,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful assertions", () => {
    it("should not throw when permission is granted", () => {
      const user = createUser("admin-1", "ADMIN");

      expect(() => {
        assertPermission(user, "posts", "create");
      }).not.toThrow();
    });

    it("should not throw when STUDENT can update their own post", () => {
      const user = createUser("student-1", "STUDENT");
      const post = createPost("post-1", "student-1");

      expect(() => {
        assertPermission(user, "posts", "update", post);
      }).not.toThrow();
    });

    it("should not throw when MODERATOR can delete any comment", () => {
      const user = createUser("mod-1", "MODERATOR");

      expect(() => {
        assertPermission(user, "comments", "delete");
      }).not.toThrow();
    });
  });

  describe("failed assertions", () => {
    it("should throw AuthorizationError when permission is denied", () => {
      const user = createUser("student-1", "STUDENT");
      const post = createPost("post-1", "other-user");

      expect(() => {
        assertPermission(user, "posts", "delete", post);
      }).toThrow(AuthorizationError);
    });

    it("should throw with correct error message", () => {
      const user = createUser("student-1", "STUDENT");
      const post = createPost("post-1", "other-user");

      expect(() => {
        assertPermission(user, "posts", "update", post);
      }).toThrow(`User student-1 not permitted to update posts`);
    });

    it("should throw when permission is undefined", () => {
      const user = createUser("user-1", "INVALID_ROLE" as Role);

      expect(() => {
        assertPermission(user, "posts", "create");
      }).toThrow(AuthorizationError);
    });

    it("should throw when function permission requires data but none provided", () => {
      const user = createUser("student-1", "STUDENT");

      expect(() => {
        assertPermission(user, "posts", "update");
      }).toThrow(AuthorizationError);
    });

    it("should throw when STUDENT tries to delete another user's comment", () => {
      const user = createUser("student-1", "STUDENT");
      const comment = { id: 123, authorId: "other-user" };

      expect(() => {
        assertPermission(user, "comments", "delete", comment);
      }).toThrow(`User student-1 not permitted to delete comments`);
    });

    it("should throw when user tries to report their own content", () => {
      const user = createUser("student-1", "STUDENT");
      const post = createPost("post-1", "student-1");

      expect(() => {
        assertPermission(user, "posts", "report", post);
      }).toThrow(AuthorizationError);
    });
  });

  describe("edge cases", () => {
    it("should throw for invalid resource", () => {
      const user = createUser("admin-1", "ADMIN");

      expect(() => {
        assertPermission(user, "invalidResource" as any, "create");
      }).toThrow(AuthorizationError);
    });

    it("should throw for invalid action", () => {
      const user = createUser("admin-1", "ADMIN");

      expect(() => {
        assertPermission(user, "posts", "invalidAction" as any);
      }).toThrow(AuthorizationError);
    });
  });
});
