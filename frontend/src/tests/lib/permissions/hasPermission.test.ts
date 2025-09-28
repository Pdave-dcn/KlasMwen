import { describe, it, expect } from "vitest";

import { hasPermission, POLICY } from "@/lib/permissions";
import type {
  User,
  PostForPolicy,
  CommentForPolicy,
} from "@/lib/permissions/types";

const adminUser: User = { id: "admin-1", role: "ADMIN" };
const studentUser: User = { id: "student-1", role: "STUDENT" };
const otherStudentUser: User = { id: "student-2", role: "STUDENT" };

const mockPost: PostForPolicy = {
  id: "post-1",
  author: {
    id: "student-1",
    username: "student1",
    avatar: { id: 1, url: "mock-url.com/avatar-1.svg" },
  },
};

const mockPostByOtherUser: PostForPolicy = {
  id: "post-2",
  author: {
    id: "student-2",
    username: "student2",
    avatar: { id: 2, url: "mock-url.com/avatar-2.svg" },
  },
};

const mockComment: CommentForPolicy = {
  id: 1,
  author: {
    id: "student-1",
    username: "student1",
    avatar: { id: 1, url: "mock-url.com/avatar-1.svg" },
  },
};

const mockCommentByOtherUser: CommentForPolicy = {
  id: 2,
  author: {
    id: "student-2",
    username: "student2",
    avatar: { id: 2, url: "mock-url.com/avatar-2.svg" },
  },
};

describe("hasPermission", () => {
  describe("ADMIN role permissions", () => {
    describe("Posts", () => {
      it("should allow ADMIN to create posts", () => {
        expect(hasPermission(adminUser, "posts", "create")).toBe(true);
      });

      it("should allow ADMIN to read posts", () => {
        expect(hasPermission(adminUser, "posts", "read")).toBe(true);
      });

      it("should not allow ADMIN to update any post", () => {
        expect(hasPermission(adminUser, "posts", "update", mockPost)).toBe(
          false
        );
        expect(
          hasPermission(adminUser, "posts", "update", mockPostByOtherUser)
        ).toBe(false);
      });

      it("should allow ADMIN to delete any post", () => {
        expect(hasPermission(adminUser, "posts", "delete", mockPost)).toBe(
          true
        );
        expect(
          hasPermission(adminUser, "posts", "delete", mockPostByOtherUser)
        ).toBe(true);
      });
    });

    describe("Comments", () => {
      it("should allow ADMIN to create comments", () => {
        expect(hasPermission(adminUser, "comments", "create")).toBe(true);
      });

      it("should allow ADMIN to read comments", () => {
        expect(hasPermission(adminUser, "comments", "read")).toBe(true);
      });

      it("should not allow ADMIN to update any comment", () => {
        expect(
          hasPermission(adminUser, "comments", "update", mockComment)
        ).toBe(false);
        expect(
          hasPermission(adminUser, "comments", "update", mockCommentByOtherUser)
        ).toBe(false);
      });

      it("should allow ADMIN to delete any comment", () => {
        expect(
          hasPermission(adminUser, "comments", "delete", mockComment)
        ).toBe(true);
        expect(
          hasPermission(adminUser, "comments", "delete", mockCommentByOtherUser)
        ).toBe(true);
      });
    });
  });

  describe("STUDENT role permissions", () => {
    describe("Posts", () => {
      it("should allow STUDENT to create posts", () => {
        expect(hasPermission(studentUser, "posts", "create")).toBe(true);
      });

      it("should allow STUDENT to read posts", () => {
        expect(hasPermission(studentUser, "posts", "read")).toBe(true);
      });

      it("should allow STUDENT to update their own post", () => {
        expect(hasPermission(studentUser, "posts", "update", mockPost)).toBe(
          true
        );
      });

      it("should not allow STUDENT to update other users posts", () => {
        expect(
          hasPermission(studentUser, "posts", "update", mockPostByOtherUser)
        ).toBe(false);
      });

      it("should allow STUDENT to delete their own post", () => {
        expect(hasPermission(studentUser, "posts", "delete", mockPost)).toBe(
          true
        );
      });

      it("should not allow STUDENT to delete other users posts", () => {
        expect(
          hasPermission(studentUser, "posts", "delete", mockPostByOtherUser)
        ).toBe(false);
      });
    });

    describe("Comments", () => {
      it("should allow STUDENT to create comments", () => {
        expect(hasPermission(studentUser, "comments", "create")).toBe(true);
      });

      it("should allow STUDENT to read comments", () => {
        expect(hasPermission(studentUser, "comments", "read")).toBe(true);
      });

      it("should allow STUDENT to update their own comment", () => {
        expect(
          hasPermission(studentUser, "comments", "update", mockComment)
        ).toBe(true);
      });

      it("should not allow STUDENT to update other users comments", () => {
        expect(
          hasPermission(
            studentUser,
            "comments",
            "update",
            mockCommentByOtherUser
          )
        ).toBe(false);
      });

      it("should allow STUDENT to delete their own comment", () => {
        expect(
          hasPermission(studentUser, "comments", "delete", mockComment)
        ).toBe(true);
      });

      it("should not allow STUDENT to delete other users comments", () => {
        expect(
          hasPermission(
            studentUser,
            "comments",
            "delete",
            mockCommentByOtherUser
          )
        ).toBe(false);
      });
    });
  });

  describe("Edge cases and error handling", () => {
    it("should return false for undefined permission", () => {
      // Invalid role
      const invalidUser = { id: "user-1", role: "INVALID_ROLE" as any };
      expect(hasPermission(invalidUser, "posts", "create")).toBe(false);
    });

    it("should return false for missing resource in policy", () => {
      // This would happen if a resource is not defined in policy for a role
      const userWithMissingPolicy: User = { id: "user-1", role: "ADMIN" };
      expect(
        hasPermission(
          userWithMissingPolicy,
          "invalid_resource" as any,
          "create"
        )
      ).toBe(false);
    });

    it("should return false for missing action in policy", () => {
      // This would happen if an action is not defined for a resource in a role's policy
      expect(hasPermission(studentUser, "posts", "invalid_action" as any)).toBe(
        false
      );
    });

    it("should return false when function permission requires data but none provided", () => {
      // STUDENT update/delete permissions are functions that require data
      expect(hasPermission(studentUser, "posts", "update")).toBe(false);
      expect(hasPermission(studentUser, "posts", "delete")).toBe(false);
      expect(hasPermission(studentUser, "comments", "update")).toBe(false);
      expect(hasPermission(studentUser, "comments", "delete")).toBe(false);
    });

    it("should handle boolean permissions without data", () => {
      // Boolean permissions should work without data
      expect(hasPermission(studentUser, "posts", "create")).toBe(true);
      expect(hasPermission(studentUser, "posts", "read")).toBe(true);
      expect(hasPermission(adminUser, "posts", "create")).toBe(true);
    });

    it("should handle function permissions with data correctly", () => {
      // Function permissions should work with data
      expect(hasPermission(studentUser, "posts", "update", mockPost)).toBe(
        true
      );
      expect(
        hasPermission(studentUser, "posts", "update", mockPostByOtherUser)
      ).toBe(false);
    });
  });

  describe("Permission consistency", () => {
    it("should maintain consistent behavior for same user and resource combinations", () => {
      // Test multiple calls return same result
      expect(hasPermission(studentUser, "posts", "update", mockPost)).toBe(
        true
      );
      expect(hasPermission(studentUser, "posts", "update", mockPost)).toBe(
        true
      );

      expect(
        hasPermission(studentUser, "posts", "update", mockPostByOtherUser)
      ).toBe(false);
      expect(
        hasPermission(studentUser, "posts", "update", mockPostByOtherUser)
      ).toBe(false);
    });

    it("should handle different users with same data consistently", () => {
      expect(hasPermission(studentUser, "posts", "update", mockPost)).toBe(
        true
      );
      expect(hasPermission(otherStudentUser, "posts", "update", mockPost)).toBe(
        false
      );
    });
  });

  describe("Policy structure validation through tests", () => {
    it("should have all expected roles in POLICY", () => {
      expect(POLICY).toHaveProperty("ADMIN");
      expect(POLICY).toHaveProperty("STUDENT");
    });

    it("should have all expected resources for each role", () => {
      expect(POLICY.ADMIN).toHaveProperty("posts");
      expect(POLICY.ADMIN).toHaveProperty("comments");
      expect(POLICY.STUDENT).toHaveProperty("posts");
      expect(POLICY.STUDENT).toHaveProperty("comments");
    });

    it("should have all expected actions for ADMIN resources", () => {
      expect(POLICY.ADMIN.posts).toHaveProperty("create");
      expect(POLICY.ADMIN.posts).toHaveProperty("read");
      expect(POLICY.ADMIN.posts).toHaveProperty("update");
      expect(POLICY.ADMIN.posts).toHaveProperty("delete");

      expect(POLICY.ADMIN.comments).toHaveProperty("create");
      expect(POLICY.ADMIN.comments).toHaveProperty("read");
      expect(POLICY.ADMIN.comments).toHaveProperty("update");
      expect(POLICY.ADMIN.comments).toHaveProperty("delete");
    });

    it("should have all expected actions for STUDENT resources", () => {
      expect(POLICY.STUDENT.posts).toHaveProperty("create");
      expect(POLICY.STUDENT.posts).toHaveProperty("read");
      expect(POLICY.STUDENT.posts).toHaveProperty("update");
      expect(POLICY.STUDENT.posts).toHaveProperty("delete");

      expect(POLICY.STUDENT.comments).toHaveProperty("create");
      expect(POLICY.STUDENT.comments).toHaveProperty("read");
      expect(POLICY.STUDENT.comments).toHaveProperty("update");
      expect(POLICY.STUDENT.comments).toHaveProperty("delete");
    });
  });

  describe("Type safety validation", () => {
    it("should work with proper TypeScript types", () => {
      // These should compile without TypeScript errors
      const result1: boolean = hasPermission(adminUser, "posts", "create");
      const result2: boolean = hasPermission(
        studentUser,
        "comments",
        "update",
        mockComment
      );

      expect(typeof result1).toBe("boolean");
      expect(typeof result2).toBe("boolean");
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle post ownership scenarios correctly", () => {
      // Student owns the post
      expect(hasPermission(studentUser, "posts", "update", mockPost)).toBe(
        true
      );
      expect(hasPermission(studentUser, "posts", "delete", mockPost)).toBe(
        true
      );

      // Different student tries to modify the post
      expect(hasPermission(otherStudentUser, "posts", "update", mockPost)).toBe(
        false
      );
      expect(hasPermission(otherStudentUser, "posts", "delete", mockPost)).toBe(
        false
      );

      // Admin can't modify anyone's post
      expect(hasPermission(adminUser, "posts", "update", mockPost)).toBe(false);
      expect(hasPermission(adminUser, "posts", "delete", mockPost)).toBe(true);
    });

    it("should handle comment ownership scenarios correctly", () => {
      // Student owns the comment
      expect(
        hasPermission(studentUser, "comments", "update", mockComment)
      ).toBe(true);
      expect(
        hasPermission(studentUser, "comments", "delete", mockComment)
      ).toBe(true);

      // Different student tries to modify the comment
      expect(
        hasPermission(otherStudentUser, "comments", "update", mockComment)
      ).toBe(false);
      expect(
        hasPermission(otherStudentUser, "comments", "delete", mockComment)
      ).toBe(false);

      // Admin can't modify anyone's comment
      expect(hasPermission(adminUser, "comments", "update", mockComment)).toBe(
        false
      );
      expect(hasPermission(adminUser, "comments", "delete", mockComment)).toBe(
        true
      );
    });

    it("should handle read/create permissions uniformly", () => {
      // All users should be able to read posts and comments
      expect(hasPermission(adminUser, "posts", "read")).toBe(true);
      expect(hasPermission(studentUser, "posts", "read")).toBe(true);
      expect(hasPermission(adminUser, "comments", "read")).toBe(true);
      expect(hasPermission(studentUser, "comments", "read")).toBe(true);

      // All users should be able to create posts and comments
      expect(hasPermission(adminUser, "posts", "create")).toBe(true);
      expect(hasPermission(studentUser, "posts", "create")).toBe(true);
      expect(hasPermission(adminUser, "comments", "create")).toBe(true);
      expect(hasPermission(studentUser, "comments", "create")).toBe(true);
    });
  });
});
