import passport from "passport";
import { it, expect, describe, vi, beforeEach } from "vitest";

import { loginUser } from "../controllers/auth/login.controller.js";
import { UserService } from "../controllers/auth/register.controller.js";

import type { NextFunction, Request, Response } from "express";

vi.mock("passport");
vi.mock("../controllers/auth/register.controller.js", () => ({
  UserService: {
    generateToken: vi.fn(),
  },
}));

const mockedPassport = vi.mocked(passport);
const mockedUserService = vi.mocked(UserService);

describe("Login controller", () => {
  let mockRequest: Request;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockRequest = {
      body: {
        email: "john@test.com",
        password: "Password123",
      },
    } as Request;

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it("should login user successfully and return token", () => {
    const mockUser = {
      id: "1",
      username: "john",
      email: "john@test.com",
      role: "STUDENT",
    };

    const mockToken = "fake_jwt_token";
    mockedUserService.generateToken.mockReturnValue(mockToken);

    const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
      callback(null, mockUser, undefined);
      return vi.fn();
    });

    mockedPassport.authenticate.mockImplementation(mockAuthenticate);

    loginUser(mockRequest, mockResponse as Response, mockNext);

    expect(mockedPassport.authenticate).toHaveBeenCalledWith(
      "local",
      { session: false },
      expect.any(Function)
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Login successful",
      user: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
      },
      token: mockToken,
    });
  });

  describe("authentication failures", () => {
    it("should return 401 when user is false", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, { message: "Invalid password" });
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate);

      loginUser(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid password",
      });
    });

    it("should return default message when info is undefined", () => {
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, false, undefined);
        return vi.fn();
      });
      mockedPassport.authenticate.mockImplementation(mockAuthenticate);

      loginUser(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid credentials",
      });
    });
  });

  describe("authentication errors", () => {
    it("should call next with error when authentication error occurs", () => {
      const authError = new Error("Database connection failed");
      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(authError, false, undefined);
        return vi.fn();
      });

      mockedPassport.authenticate.mockImplementation(mockAuthenticate);

      loginUser(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(authError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("passport integration", () => {
    it("should call passport.authenticate with correct parameters", () => {
      const mockAuthenticate = vi.fn(() => vi.fn());
      mockedPassport.authenticate.mockImplementation(mockAuthenticate);

      loginUser(mockRequest, mockResponse as Response, mockNext);

      expect(mockedPassport.authenticate).toHaveBeenCalledWith(
        "local",
        { session: false },
        expect.any(Function)
      );
    });

    it("should return function that calls req, res, next", () => {
      const mockPassportFunction = vi.fn();
      const mockAuthenticate = vi.fn(() => mockPassportFunction);
      mockedPassport.authenticate.mockImplementation(mockAuthenticate);

      loginUser(mockRequest, mockResponse as Response, mockNext);

      expect(mockPassportFunction).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockNext
      );
    });
  });

  describe("user data handling", () => {
    it("should only return safe user data (no password)", () => {
      const mockUser = {
        id: "1",
        username: "john",
        email: "john@test.com",
        role: "STUDENT",
        password: "hashed_password",
        bio: "Some bio",
        avatarUrl: "https://some-url.app",
      } as any;

      const mockToken = "fake_jwt_token";
      mockedUserService.generateToken.mockReturnValue(mockToken);

      const mockAuthenticate = vi.fn((_strategy, _options, callback) => {
        callback(null, mockUser, undefined);
        return vi.fn();
      });
      mockedPassport.authenticate.mockImplementation(mockAuthenticate);

      loginUser(mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Login successful",
        user: {
          id: "1",
          username: "john",
          email: "john@test.com",
          role: "STUDENT",
        },
        token: mockToken,
      });
    });
  });
});
