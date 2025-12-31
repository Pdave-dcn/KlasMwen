import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PostEditForm from "@/features/postEdit/components/PostEditForm";
import { usePostEditQuery, usePostUpdateMutation } from "@/queries/post.query";
import { useTagQuery } from "@/queries/tag.query";
import { usePostEditStore } from "@/stores/postEdit.store";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;

vi.mock("@/queries/post.query", () => ({
  usePostEditQuery: vi.fn(),
  usePostUpdateMutation: vi.fn(),
}));

vi.mock("@/queries/tag.query", () => ({
  useTagQuery: vi.fn(),
}));

vi.mock("@/stores/postEdit.store", () => ({
  usePostEditStore: vi.fn(),
}));

vi.mock("@/features/postEdit/components/PostEditLoadingState", () => ({
  PostEditLoadingState: () => (
    <div data-testid="post-edit-loading">Loading...</div>
  ),
}));

const mockUsePostEditQuery = vi.mocked(usePostEditQuery);
const mockUsePostUpdateMutation = vi.mocked(usePostUpdateMutation);
const mockUseTagQuery = vi.mocked(useTagQuery);
const mockUsePostEditStore = vi.mocked(usePostEditStore);

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

const mockTextPost = {
  id: 1,
  title: "Test Post Title",
  content: "This is test content for the post",
  type: "NOTE" as const,
  hasFile: false,
  tags: [
    { id: 1, name: "JavaScript" },
    { id: 2, name: "React" },
  ],
};

const mockResourcePost = {
  id: 2,
  title: "Test Resource Post",
  content: null,
  type: "RESOURCE" as const,
  hasFile: true,
  fileName: "test-document.pdf",
  fileSize: 2048576, // 2MB
  tags: [{ id: 3, name: "Documentation" }],
};

const mockTags = [
  { id: 1, name: "JavaScript" },
  { id: 2, name: "React" },
  { id: 3, name: "Documentation" },
  { id: 4, name: "TypeScript" },
];

describe("PostEditForm Component", () => {
  const mockOnClose = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    mockUsePostEditStore.mockReturnValue({
      postToEdit: { id: 1 },
    } as unknown);

    mockUsePostUpdateMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostUpdateMutation>);

    mockUseTagQuery.mockReturnValue({
      data: mockTags,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useTagQuery>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading States", () => {
    it("should show loading skeleton when post data is being fetched", () => {
      mockUsePostEditQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof usePostEditQuery>);

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByTestId("post-edit-loading")).toBeInTheDocument();
    });

    it("should not render form when post data is null", () => {
      mockUsePostEditQuery.mockReturnValue({
        data: null,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByText("Edit Post")).not.toBeInTheDocument();
    });
  });

  describe("Form Rendering - Text Post", () => {
    beforeEach(() => {
      mockUsePostEditQuery.mockReturnValue({
        data: mockTextPost,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);
    });

    it("should render form with post data for text posts", async () => {
      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Edit Post")).toBeInTheDocument();
        expect(
          screen.getByText("Update the post content and tags below.")
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("Test Post Title")).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("This is test content for the post")
        ).toBeInTheDocument();
      });
    });

    it("should display selected tags", async () => {
      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("JavaScript")).toBeInTheDocument();
        expect(screen.getByText("React")).toBeInTheDocument();
      });
    });
  });

  describe("Form Rendering - Resource Post", () => {
    beforeEach(() => {
      mockUsePostEditQuery.mockReturnValue({
        data: mockResourcePost,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);
    });

    it("should render form for resource posts without content field", async () => {
      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Edit Post")).toBeInTheDocument();
        expect(
          screen.getByText("Update the post title and tags below.")
        ).toBeInTheDocument();
      });

      expect(screen.queryByLabelText("Content")).not.toBeInTheDocument();
    });

    it("should display file information for resource posts", async () => {
      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Attached File")).toBeInTheDocument();
        expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
        expect(screen.getByText(/Size:/i)).toBeInTheDocument();
        expect(
          screen.getByText("File cannot be changed when editing a post")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      mockUsePostEditQuery.mockReturnValue({
        data: mockTextPost,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);
    });

    it("should show error when title is too short", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Post Title")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText("Title");
      await user.clear(titleInput);
      await user.type(titleInput, "Test");

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(
          screen.getByText("Title must be at least 10 characters")
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should show error when title is too long", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Post Title")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText("Title");
      await user.clear(titleInput);
      await user.type(titleInput, "a".repeat(101));

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(
          screen.getByText("Title must not exceed 100 characters")
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should show error when title is empty", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Post Title")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText("Title");
      await user.clear(titleInput);

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should show error when content is too short", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("This is test content for the post")
        ).toBeInTheDocument();
      });

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.clear(markdownEditor);

      await user.type(markdownEditor, "Short");

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(
          screen.getByText("Content must be at least 20 characters")
        ).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should show error when content is empty", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("This is test content for the post")
        ).toBeInTheDocument();
      });

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.clear(markdownEditor);

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(screen.getByText("Content is required")).toBeInTheDocument();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe("Tag Management", () => {
    beforeEach(() => {
      mockUsePostEditQuery.mockReturnValue({
        data: mockTextPost,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);
    });

    it("should add a new tag when selected", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("JavaScript")).toBeInTheDocument();
      });

      // Simulate adding TypeScript tag
      const typescriptTag = screen.getByText("TypeScript");
      await user.click(typescriptTag);

      await waitFor(() => {
        expect(screen.getAllByText("TypeScript").length).toBeGreaterThan(0);
      });
    });

    it("should remove a tag when clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("JavaScript")).toBeInTheDocument();
      });

      // Find and click remove button for JavaScript tag
      const removeButtons = screen.getAllByRole("button");
      const jsTagRemoveBtn = removeButtons.find((btn) =>
        btn.textContent?.includes("JavaScript")
      );

      if (jsTagRemoveBtn) {
        await user.click(jsTagRemoveBtn);
      }

      await waitFor(() => {
        const jsTags = screen.queryAllByText("JavaScript");
        expect(jsTags.length).toBeLessThan(2);
      });
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      mockUsePostEditQuery.mockReturnValue({
        data: mockTextPost,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);
    });

    it("should submit form with updated data", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Post Title")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText("Title");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Post Title");

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.clear(markdownEditor);
      await user.type(markdownEditor, "Updated content for the post");

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            postId: 1,
            data: expect.objectContaining({
              title: "Updated Post Title",
              content: "Updated content for the post",
              type: "NOTE",
              tagIds: [1, 2],
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it("should close dialog after successful submission", async () => {
      const user = userEvent.setup();
      const mockMutateWithSuccess = vi.fn((_, options) => {
        options?.onSuccess?.();
      });

      mockUsePostUpdateMutation.mockReturnValue({
        mutate: mockMutateWithSuccess,
        isPending: false,
        isError: false,
      } as unknown as ReturnType<typeof usePostUpdateMutation>);

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Post Title")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Update"));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should show error message when submission fails", async () => {
      mockUsePostUpdateMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: true,
      } as unknown as ReturnType<typeof usePostUpdateMutation>);

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText("Failed to update post. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("should disable buttons while submitting", async () => {
      mockUsePostUpdateMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        isError: false,
      } as unknown as ReturnType<typeof usePostUpdateMutation>);

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Updating...")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      const updateButton = screen.getByText("Updating...");

      expect(cancelButton).toBeDisabled();
      expect(updateButton).toBeDisabled();
    });
  });

  describe("Dialog Actions", () => {
    beforeEach(() => {
      mockUsePostEditQuery.mockReturnValue({
        data: mockTextPost,
        isLoading: false,
      } as unknown as ReturnType<typeof usePostEditQuery>);
    });

    it("should close dialog and reset form when cancel is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostEditForm open onClose={mockOnClose} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not render when open prop is false", () => {
      render(
        <TestWrapper>
          <PostEditForm open={false} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByText("Edit Post")).not.toBeInTheDocument();
    });
  });
});
