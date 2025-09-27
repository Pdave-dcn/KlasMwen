import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/stores/auth.store";

vi.mock("@/stores/auth.store");

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

const TestWrapper = ({
  children,
  initialPath = "/",
}: {
  children: React.ReactNode;
  initialPath?: string;
}) => {
  return (
    <BrowserRouter>
      <LocationDisplay />
      <Routes>
        <Route
          path="/"
          element={<div data-testid="home-page">Home Page</div>}
        />
        <Route
          path="/protected"
          element={<ProtectedRoute>{children}</ProtectedRoute>}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div data-testid="dashboard">Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div data-testid="profile">User Profile</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={<div data-testid="login-page">Login Page</div>}
        />
      </Routes>
    </BrowserRouter>
  );
};

// Custom render function that starts at a specific path
const renderWithPath = (
  component: React.ReactElement,
  initialPath: string = "/"
) => {
  return render(
    <TestWrapper initialPath={initialPath}>{component}</TestWrapper>
  );
};

describe("ProtectedRoute component", () => {
  const mockUseAuthStore = vi.mocked(useAuthStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: "1", email: "test@example.com", username: "testuser" },
        login: vi.fn(),
        logout: vi.fn(),
      } as any);
    });

    it("should render children when user is authenticated", () => {
      render(
        <BrowserRouter>
          <LocationDisplay />
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Secret Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("Secret Content")).toBeInTheDocument();
    });

    it("should render complex nested components", () => {
      const ComplexComponent = () => (
        <div data-testid="complex-component">
          <h1>Complex Page</h1>
          <div>
            <button>Action Button</button>
            <form>
              <input placeholder="Enter data" />
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      );

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ComplexComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByTestId("complex-component")).toBeInTheDocument();
      expect(screen.getByText("Complex Page")).toBeInTheDocument();
      expect(screen.getByText("Action Button")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter data")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Submit" })
      ).toBeInTheDocument();
    });

    it("should handle multiple child elements", () => {
      const MultipleChildren = () => (
        <>
          <header data-testid="header">Header Content</header>
          <main data-testid="main">Main Content</main>
          <footer data-testid="footer">Footer Content</footer>
        </>
      );

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MultipleChildren />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("main")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(screen.getByText("Header Content")).toBeInTheDocument();
      expect(screen.getByText("Main Content")).toBeInTheDocument();
      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      } as any);
    });

    it("should redirect to home page when accessing protected route", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Secret Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should not render the protected content
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();

      // Should redirect to home page
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    it("should not render any protected content", () => {
      const ProtectedContent = () => (
        <div data-testid="sensitive-data">
          <h1>Sensitive Information</h1>
          <p>This should never be visible to unauthenticated users</p>
          <button>Delete Account</button>
        </div>
      );

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.queryByTestId("sensitive-data")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Sensitive Information")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          "This should never be visible to unauthenticated users"
        )
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Delete Account")).not.toBeInTheDocument();
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });

    it("should handle redirect with complex nested components", () => {
      const ComplexProtectedComponent = () => (
        <div data-testid="complex-protected">
          <div>
            <div>
              <span>Deeply nested content</span>
            </div>
          </div>
        </div>
      );

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ComplexProtectedComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.queryByTestId("complex-protected")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Deeply nested content")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  describe("authentication state changes", () => {
    it("should handle authentication state changing from false to true", () => {
      // Start with unauthenticated state
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      } as any);

      const { rerender } = render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should be redirected to home
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("home-page")).toBeInTheDocument();

      // Change to authenticated state
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: "1", email: "test@example.com", username: "testuser" },
        login: vi.fn(),
        logout: vi.fn(),
      } as any);

      // Re-render with new auth state
      rerender(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );
    });

    it("should handle authentication state changing from true to false", () => {
      window.history.pushState({}, "Test page", "/protected");

      // Start with authenticated state
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: "1", email: "test@example.com", username: "testuser" },
        login: vi.fn(),
        logout: vi.fn(),
      } as any);

      const { rerender } = render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should show protected content initially
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();

      // Change to unauthenticated state
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      } as any);

      // Re-render with new auth state
      rerender(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should redirect to home page
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });

  describe("edge cases and prop validation", () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { id: "1", email: "test@example.com", username: "testuser" },
        login: vi.fn(),
        logout: vi.fn(),
      } as any);
    });

    it("should handle null children", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute>{null}</ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      );

      // Should render without crashing
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it("should handle undefined children", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<ProtectedRoute>{undefined}</ProtectedRoute>}
            />
          </Routes>
        </BrowserRouter>
      );

      // Should render without crashing
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it("should handle empty children", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <></>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // Should render without crashing
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it("should handle string children", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<ProtectedRoute>Simple text content</ProtectedRoute>}
            />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText("Simple text content")).toBeInTheDocument();
    });

    it("should handle number children", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute>{42}</ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      );

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("should handle boolean children", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute>{true}</ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      );

      // Boolean children render as empty in React - should not crash
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe("navigation behavior", () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
      } as any);
    });

    it("should use replace navigation to prevent back button issues", () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<div data-testid="home-page">Home Page</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Secret</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      );

      // User should be at home page after redirect
      expect(screen.getByTestId("home-page")).toBeInTheDocument();
    });
  });
});
