import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import { socketAuthMiddleware } from "../../../src/socket/auth/auth.js";
import UserService from "../../../src/features/user/service/UserService.js";
import { UserNotFoundError } from "../../../src/core/error/custom/user.error.js";
import env from "../../../src/core/config/env.js";
import * as cookieParser from "../../../src/socket/utils/parseCookies.js";

vi.mock("jsonwebtoken");
vi.mock("../../../src/features/user/service/UserService.js");
vi.mock("../../../src/socket/utils/parseCookies.js");

describe("socketAuthMiddleware", () => {
  let socket: any;
  let next: any;
  const mockUser = {
    id: "user-1",
    username: "testUser",
    role: "STUDENT" as const,
  };
  const validToken = "valid.jwt.token";

  beforeEach(() => {
    vi.clearAllMocks();
    socket = {
      handshake: {
        headers: {
          cookie: "token=valid.jwt.token; other=value",
        },
      },
      data: {},
    };
    next = vi.fn();
  });

  it("should authenticate and attach user to socket when token is valid", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ id: "user-1" } as any);
    vi.mocked(UserService.getUserForSocket).mockResolvedValue(mockUser);

    await socketAuthMiddleware(socket, next);

    expect(socket.data.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
  });

  it("should call next with error when token is missing", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({});

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe("Authentication required");
  });

  it("should call next with error when jwt.verify fails", async () => {
    const tokenError = new Error("Token expired");
    vi.mocked(cookieParser.parseCookies).mockReturnValue({
      token: "invalid.token",
    });
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw tokenError;
    });

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(tokenError);
  });

  it("should call next with error when payload has no id", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ username: "noId" } as any);

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe("Invalid token payload");
  });

  it("should call next with error when user is not found", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ id: "nonexistent" } as any);
    vi.mocked(UserService.getUserForSocket).mockRejectedValue(
      new UserNotFoundError("nonexistent"),
    );

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const error = (next as any).mock.calls[0][0];
    expect(error.message).toBe("User not found");
  });

  it("should pass other errors to next", async () => {
    const dbError = new Error("Database connection failed");
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ id: "user-1" } as any);
    vi.mocked(UserService.getUserForSocket).mockRejectedValue(dbError);

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });

  it("should use jwt.verify with correct secret", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ id: "user-1" } as any);
    vi.mocked(UserService.getUserForSocket).mockResolvedValue(mockUser);

    await socketAuthMiddleware(socket, next);

    expect(jwt.verify).toHaveBeenCalledWith(validToken, env.JWT_SECRET);
  });

  it("should extract user with correct id from database", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ id: "specific-user-id" } as any);
    vi.mocked(UserService.getUserForSocket).mockResolvedValue(mockUser);

    await socketAuthMiddleware(socket, next);

    expect(UserService.getUserForSocket).toHaveBeenCalledWith(
      "specific-user-id",
    );
  });

  it("should not call next with arguments on success", async () => {
    vi.mocked(cookieParser.parseCookies).mockReturnValue({ token: validToken });
    vi.mocked(jwt.verify).mockReturnValue({ id: "user-1" } as any);
    vi.mocked(UserService.getUserForSocket).mockResolvedValue(mockUser);

    await socketAuthMiddleware(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
