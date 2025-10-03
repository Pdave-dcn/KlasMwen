import { BrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Layout from "@/components/layout/Layout";

vi.mock("@/components/layout/Sidebar", () => ({
  default: ({ onCreateClick }: { onCreateClick: () => void }) => (
    <div data-testid="sidebar">
      <button onClick={onCreateClick}>Create Post</button>
    </div>
  ),
}));

vi.mock("@/components/layout/MobileSidebar", () => ({
  default: ({ onCreateClick }: { onCreateClick: () => void }) => (
    <div data-testid="mobile-tab-bar">
      <button onClick={onCreateClick}>Mobile Create</button>
    </div>
  ),
}));

vi.mock("@/features/PostCreation/components/PostTypeSelector", () => ({
  default: ({ open, onSelect, onClose }: any) =>
    open ? (
      <div data-testid="post-type-selector">
        <button onClick={() => onSelect("note")}>Select Note</button>
        <button onClick={() => onSelect("resource")}>Select Resource</button>
        <button onClick={onClose}>Close Selector</button>
      </div>
    ) : null,
}));

vi.mock("@/features/PostCreation/components/postForm/PostForm", () => ({
  default: ({ open, onClose, postType }: any) =>
    open ? (
      <div data-testid="post-form">
        <span data-testid="post-type">{postType}</span>
        <button onClick={onClose}>Close Form</button>
      </div>
    ) : null,
}));

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

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders children correctly", () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Test Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("renders Sidebar component", () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });

    it("renders MobileTabBar component", () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.getByTestId("mobile-tab-bar")).toBeInTheDocument();
    });

    it("does not render PostTypeSelector initially", () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(
        screen.queryByTestId("post-type-selector")
      ).not.toBeInTheDocument();
    });

    it("does not render PostForm initially", () => {
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      expect(screen.queryByTestId("post-form")).not.toBeInTheDocument();
    });
  });

  describe("PostTypeSelector interactions", () => {
    it("shows PostTypeSelector when sidebar create button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Create Post"));

      expect(screen.getByTestId("post-type-selector")).toBeInTheDocument();
    });

    it("shows PostTypeSelector when mobile create button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Mobile Create"));

      expect(screen.getByTestId("post-type-selector")).toBeInTheDocument();
    });

    it("closes PostTypeSelector when close button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Create Post"));
      expect(screen.getByTestId("post-type-selector")).toBeInTheDocument();

      await user.click(screen.getByText("Close Selector"));
      expect(
        screen.queryByTestId("post-type-selector")
      ).not.toBeInTheDocument();
    });
  });

  describe("PostForm interactions", () => {
    it("shows PostForm with correct type when type is selected", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Create Post"));
      await user.click(screen.getByText("Select Note"));

      expect(screen.getByTestId("post-form")).toBeInTheDocument();
      expect(screen.getByTestId("post-type")).toHaveTextContent("note");
    });

    it("hides PostTypeSelector when type is selected", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Create Post"));
      await user.click(screen.getByText("Select Resource"));

      expect(
        screen.queryByTestId("post-type-selector")
      ).not.toBeInTheDocument();
    });

    it("closes PostForm when close button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Create Post"));
      await user.click(screen.getByText("Select Note"));
      expect(screen.getByTestId("post-form")).toBeInTheDocument();

      await user.click(screen.getByText("Close Form"));
      expect(screen.queryByTestId("post-form")).not.toBeInTheDocument();
    });

    it("resets selected type when form is closed", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      await user.click(screen.getByText("Create Post"));
      await user.click(screen.getByText("Select Note"));
      await user.click(screen.getByText("Close Form"));

      // Open form again and verify type is reset
      await user.click(screen.getByText("Create Post"));
      await user.click(screen.getByText("Select Resource"));

      expect(screen.getByTestId("post-type")).toHaveTextContent("resource");
    });
  });

  describe("Layout structure", () => {
    it("applies correct CSS classes to main container", () => {
      const { container } = render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      const mainContainer = container.querySelector(".flex.h-screen.w-full");
      expect(mainContainer).toBeInTheDocument();
    });

    it("applies correct CSS classes to aside element", () => {
      const { container } = render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      const aside = container.querySelector("aside");
      expect(aside).toHaveClass(
        "hidden",
        "md:block",
        "w-auto",
        "lg:w-60",
        "lg:border-r",
        "shrink-0"
      );
    });

    it("applies correct CSS classes to main element", () => {
      const { container } = render(
        <TestWrapper>
          <Layout>
            <div>Content</div>
          </Layout>
        </TestWrapper>
      );

      const main = container.querySelector("main");
      expect(main).toHaveClass("flex-1", "overflow-auto");
    });
  });
});
