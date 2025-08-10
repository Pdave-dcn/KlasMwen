import { describe, it, expect } from "vitest";

import {
  UpdateUserProfileSchema,
  UserIdParamSchema,
} from "../../zodSchemas/user.zod.js";

describe("User Zod Schemas", () => {
  describe("UserIdParamSchema", () => {
    it("should successfully parse a valid UUID", () => {
      const result = UserIdParamSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should fail to parse an invalid UUID format", () => {
      const result = UserIdParamSchema.safeParse({ id: "invalid-uuid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Invalid user ID format in URL parameter."
        );
      }
    });

    it("should fail to parse a non-string value for id", () => {
      const result = UserIdParamSchema.safeParse({ id: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateUserProfileSchema", () => {
    it("should successfully parse valid data with both bio and avatarUrl", () => {
      const result = UpdateUserProfileSchema.safeParse({
        bio: "Updated bio",
        avatarUrl: "https://example.com/new-avatar.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("should successfully parse valid data with only a bio", () => {
      const result = UpdateUserProfileSchema.safeParse({ bio: "New bio only" });
      expect(result.success).toBe(true);
    });

    it("should successfully parse valid data with only an avatarUrl", () => {
      const result = UpdateUserProfileSchema.safeParse({
        avatarUrl: "https://example.com/avatar.png",
      });
      expect(result.success).toBe(true);
    });

    it("should fail to parse with an empty request body", () => {
      const result = UpdateUserProfileSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one field (bio or avatarUrl) must be provided with valid data for update."
        );
      }
    });

    it("should fail to parse with empty strings for both bio and avatarUrl", () => {
      const result = UpdateUserProfileSchema.safeParse({
        bio: "",
        avatarUrl: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one field (bio or avatarUrl) must be provided with valid data for update."
        );
      }
    });

    it("should fail to parse with only an empty bio", () => {
      const result = UpdateUserProfileSchema.safeParse({ bio: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one field (bio or avatarUrl) must be provided with valid data for update."
        );
      }
    });

    it("should fail to parse with only an empty avatarUrl", () => {
      const result = UpdateUserProfileSchema.safeParse({ avatarUrl: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least one field (bio or avatarUrl) must be provided with valid data for update."
        );
      }
    });

    it("should fail to parse if the bio is too long (over 160 characters)", () => {
      const result = UpdateUserProfileSchema.safeParse({
        bio: "x".repeat(161),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Bio must be less than 160 characters."
        );
      }
    });

    it("should fail to parse an invalid avatar URL format", () => {
      const result = UpdateUserProfileSchema.safeParse({
        avatarUrl: "invalid-url",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Avatar URL must be a valid image URL."
        );
      }
    });

    it("should fail to parse a URL without a valid image extension", () => {
      const result = UpdateUserProfileSchema.safeParse({
        avatarUrl: "https://example.com/not-an-image",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Avatar URL must be a valid image URL."
        );
      }
    });

    it("should fail to parse a non-HTTPS/HTTP avatar URL", () => {
      const result = UpdateUserProfileSchema.safeParse({
        avatarUrl: "ftp://example.com/avatar.jpg",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Avatar URL must be a valid image URL."
        );
      }
    });

    it("should fail to parse invalid data types in the request body", () => {
      const result = UpdateUserProfileSchema.safeParse({
        bio: 123, // Should be string
        avatarUrl: true, // Should be string
      });
      expect(result.success).toBe(false);
    });
  });
});
