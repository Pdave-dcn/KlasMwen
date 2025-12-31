import { BrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "@/api/auth.api";
import AuthForm from "@/pages/AuthForm";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/api/auth.api");
vi.mock("@/stores/auth.store");

// Mock navigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignIn = vi.mocked(authApi.signIn);
const mockSignUp = vi.mocked(authApi.signUp);
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("AuthForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth store
    vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue({
      login: mockLogin,
    });
  });

  describe("Sign In Flow", () => {
    it("should successfully sign in with valid credentials", async () => {
      const user = userEvent.setup();

      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        role: "STUDENT" as const,
        avatar: {
          id: 1,
          url: "https://mock-avatar-url.com",
        },
      };
      const mockServerResponse = {
        message: "Sign in successful",
        user: mockUser,
      };

      mockSignIn.mockResolvedValueOnce(mockServerResponse);

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      // Fill in valid credentials
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");

      // Submit form
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          {
            email: "test@example.com",
            password: "ValidPass123",
          },
          expect.any(Object)
        );
        expect(mockLogin).toHaveBeenCalledWith(mockUser);
        expect(mockNavigate).toHaveBeenCalledWith("/home");
      });
    });

    it("should show loading state during sign in", async () => {
      const user = userEvent.setup();

      // Mock a pending request
      mockSignIn.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /signing in.../i })
      ).toBeDisabled();
    });

    it("should display validation errors for invalid email", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Should not call API with invalid data
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("should display validation errors for weak password", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "weak");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("should handle authentication failure", async () => {
      const user = userEvent.setup();

      mockSignIn.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: "Invalid credentials" },
        },
      });

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "WrongPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/no account found with this email/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Sign Up Flow", () => {
    it("should successfully sign up with valid data", async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        role: "STUDENT" as const,
        avatar: {
          id: 1,
          url: "https://mock-avatar-url.com",
        },
      };
      const mockServerResponse = {
        message: "Sign up successful",
        user: mockUser,
      };

      mockSignUp.mockResolvedValueOnce(mockServerResponse);

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      // Fill in valid registration data
      await user.type(screen.getByLabelText(/username/i), "newuser");
      await user.type(screen.getByLabelText(/email/i), "new@example.com");
      await user.type(
        screen.getByPlaceholderText(/enter your password/i),
        "ValidPass123"
      );

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          {
            username: "newuser",
            email: "new@example.com",
            password: "ValidPass123",
          },
          expect.any(Object)
        );
        expect(mockLogin).toHaveBeenCalledWith(mockUser);
        expect(mockNavigate).toHaveBeenCalledWith("/home");
      });
    });

    it("should show loading state during sign up", async () => {
      const user = userEvent.setup();

      mockSignUp.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), "newuser");
      await user.type(screen.getByLabelText(/email/i), "new@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(screen.getByText(/creating account.../i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /creating account.../i })
      ).toBeDisabled();
    });

    it("should display validation errors for invalid username", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), "a"); // Too short
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/username must be at least 3 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should handle duplicate email error", async () => {
      const user = userEvent.setup();

      mockSignUp.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            message: "Unique constraint violation",
            fields: ["email"],
          },
        },
      });

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), "newuser");
      await user.type(screen.getByLabelText(/email/i), "existing@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/this email is already registered/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Switching", () => {
    it("should switch from signin to signup and clear form", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      // Fill in signin form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");

      // Switch to signup
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Should show signup form with username field
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeInTheDocument();

      // Form should be cleared
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
    });

    it("should switch from signup to signin and clear form", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      // Fill in signup form
      await user.type(screen.getByLabelText(/username/i), "testuser");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");

      // Switch to signin
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show signin form without username field
      expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();

      // Form should be cleared
      expect(screen.getByLabelText(/email/i)).toHaveValue("");
      expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const toggleButton = screen.getByRole("button", {
        name: /show password/i,
      });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute("type", "password");

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      // Click to hide password again
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should reset password visibility when switching forms", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.click(screen.getByRole("button", { name: /show password/i }));
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "type",
        "text"
      );

      // Switch forms
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Password should be hidden again
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "type",
        "password"
      );
    });
  });

  describe("Form Validation", () => {
    it("should validate all required fields for signup", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      // Submit empty form
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should validate password complexity requirements", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), "testuser");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "lowercase123"); // Missing uppercase
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            /password must contain at least one uppercase letter/i
          )
        ).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should validate username format requirements", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), "invalid username!"); // Contains spaces and special chars
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(
            /username can only contain letters, numbers, underscores, and hyphens/i
          )
        ).toBeInTheDocument();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it("should clear validation errors when switching forms", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      // Create validation errors
      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument();
      });

      // Switch to signup
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Errors should be cleared
      expect(
        screen.queryByText(/please enter a valid email address/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();

      mockSignIn.mockRejectedValueOnce({
        response: undefined, // Network error
      });

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        // Should handle network error (toast would be shown in real app)
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it("should handle rate limiting errors", async () => {
      const user = userEvent.setup();

      mockSignIn.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { message: "Too many authentication attempts." },
        },
      });

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
        // Rate limit error would be handled by toast in real app
      });
    });
  });

  describe("User Experience", () => {
    it("should show appropriate form labels and placeholders", () => {
      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      expect(
        screen.getByPlaceholderText(/enter your email/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/enter your password/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/welcome back!/i)).toBeInTheDocument();
    });

    it("should show signup-specific fields and content", () => {
      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/choose a username/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/join the community/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeInTheDocument();
    });

    it("should not show forgot password link in signup mode", () => {
      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      expect(
        screen.queryByRole("button", { name: /forgot password/i })
      ).not.toBeInTheDocument();
    });

    it("should show terms and privacy policy links", () => {
      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      expect(
        screen.getByRole("link", { name: /terms of service/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /privacy policy/i })
      ).toBeInTheDocument();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle rapid form switching without issues", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signin" />
        </TestWrapper>
      );

      // Rapidly switch between forms
      await user.click(screen.getByRole("button", { name: /sign up/i }));
      await user.click(screen.getByRole("button", { name: /sign in/i }));
      await user.click(screen.getByRole("button", { name: /sign up/i }));

      // Should still be functional
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeInTheDocument();
    });

    it("should maintain form state during validation", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      // Fill in partial valid data
      await user.type(screen.getByLabelText(/username/i), "validuser");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "weak"); // Invalid password

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });

      // Valid data should still be present
      expect(screen.getByLabelText(/username/i)).toHaveValue("validuser");
      expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
    });

    it("should handle successful submission after fixing validation errors", async () => {
      const user = userEvent.setup();

      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        role: "STUDENT" as const,
        avatar: {
          id: 1,
          url: "https://mock-avatar-url.com",
        },
      };
      const mockServerResponse = {
        message: "Sign in successful",
        user: mockUser,
      };

      mockSignUp.mockResolvedValueOnce(mockServerResponse);

      render(
        <TestWrapper>
          <AuthForm defaultMode="signup" />
        </TestWrapper>
      );

      // First attempt with invalid data
      await user.type(screen.getByLabelText(/username/i), "ab"); // Too short
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "ValidPass123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/username must be at least 3 characters/i)
        ).toBeInTheDocument();
      });

      // Fix the username
      await user.clear(screen.getByLabelText(/username/i));
      await user.type(screen.getByLabelText(/username/i), "validuser");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          {
            username: "validuser",
            email: "test@example.com",
            password: "ValidPass123",
          },
          expect.any(Object)
        );
      });
    });
  });
});
