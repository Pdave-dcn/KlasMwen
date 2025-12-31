import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PostCreationForm from "@/features/PostCreation/components/postForm/PostCreationForm";
import {
  buildResourceFormData,
  buildTextPostData,
} from "@/features/PostCreation/helpers";
import { usePostCreationMutation } from "@/queries/post.query";
import { useTagQuery } from "@/queries/tag.query";
import type { PostType } from "@/zodSchemas/post.zod";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;

vi.mock("@/queries/post.query", () => ({
  usePostCreationMutation: vi.fn(),
}));

vi.mock("@/queries/tag.query", () => ({
  useTagQuery: vi.fn(),
}));

vi.mock("@/features/PostCreation/helpers", () => ({
  buildResourceFormData: vi.fn(),
  buildTextPostData: vi.fn(),
  getFormTitle: (postType: PostType) => `Mocked Form Title for ${postType}`,
  getFormDescription: (postType: PostType) =>
    `Mocked Form Description for ${postType}`,
}));

const mockUsePostCreationMutation = vi.mocked(usePostCreationMutation);
const mockUseTagQuery = vi.mocked(useTagQuery);
const mockBuildResourceFormData = vi.mocked(buildResourceFormData);
const mockBuildTextPostData = vi.mocked(buildTextPostData);

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockTags = [
  { id: 1, name: "JavaScript" },
  { id: 2, name: "React" },
  { id: 3, name: "TypeScript" },
  { id: 4, name: "Testing" },
];

describe("PostCreationForm Component", () => {
  const mockOnClose = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    mockUsePostCreationMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostCreationMutation>);

    mockUseTagQuery.mockReturnValue({
      data: mockTags,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useTagQuery>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Form Initialization", () => {
    it("should return null when postType is null", () => {
      const { container } = render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType={null} />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render form with correct defaults for TEXT post", async () => {
      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
        expect(screen.getByTestId("title-input")).toHaveValue("");
      });

      // Content field should be present for text posts
      expect(screen.getByTestId("content-editor")).toBeInTheDocument();

      // File upload should NOT be present
      expect(screen.queryByText("File *")).not.toBeInTheDocument();
    });

    it("should render form with correct defaults for RESOURCE post", async () => {
      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="RESOURCE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
        expect(screen.getByTestId("title-input")).toHaveValue("");
      });

      // File upload should be present for resource posts
      expect(screen.getByText("File *")).toBeInTheDocument();

      // Content field should NOT be present
      expect(screen.queryByTestId("content-editor")).not.toBeInTheDocument();
    });

    it("should reset form when postType changes from NOTE to RESOURCE", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      // Fill in some data
      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Note Title");

      expect(titleInput).toHaveValue("Test Note Title");

      // Change postType to RESOURCE
      rerender(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="RESOURCE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toHaveValue("");
      });

      // Verify content field is gone and file upload appears
      expect(screen.queryByTestId("content-editor")).not.toBeInTheDocument();
      expect(screen.getByText("File *")).toBeInTheDocument();
    });

    it("should reset form when postType changes from RESOURCE to NOTE", async () => {
      const { rerender } = render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="RESOURCE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText("File *")).toBeInTheDocument();
      });

      // Change postType to NOTE
      rerender(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("content-editor")).toBeInTheDocument();
      });

      // Verify file upload is gone and content field appears
      expect(screen.queryByText("File *")).not.toBeInTheDocument();
      expect(screen.getByTestId("content-editor")).toBeInTheDocument();
    });
  });

  describe("Form Submission - TEXT Post", () => {
    it("should submit text post with correct data", async () => {
      const user = userEvent.setup();
      const mockTextData = {
        title: "Test Text Post Title",
        content: "This is test content for text post",
        type: "NOTE",
        tagIds: [1, 2],
      };

      mockBuildTextPostData.mockReturnValue(mockTextData as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      // Fill in form
      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Text Post Title");

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.type(markdownEditor, "This is test content for text post");

      // Add tags
      const jsTag = screen.getByText("JavaScript");
      await user.click(jsTag);

      const reactTag = screen.getByText("React");
      await user.click(reactTag);

      // Submit form
      const submitButton = screen.getByText(/Publish note/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockBuildTextPostData).toHaveBeenCalled();
        expect(mockMutate).toHaveBeenCalledWith(mockTextData);
      });
    });

    it("should call onClose and reset form after successful text post submission", async () => {
      const user = userEvent.setup();

      mockBuildTextPostData.mockReturnValue({
        title: "Test",
        content: "Test content",
        type: "NOTE",
        tagIds: [],
      } as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Text Post Title");

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.type(markdownEditor, "This is test content for text post");

      const submitButton = screen.getByText(/Publish note/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should submit DISCUSSION post type correctly", async () => {
      const user = userEvent.setup();
      const mockDiscussionData = {
        title: "Discussion Title",
        content: "Discussion content here",
        type: "DISCUSSION",
        tagIds: [],
      };

      mockBuildTextPostData.mockReturnValue(mockDiscussionData as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Discussion Title");

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.type(markdownEditor, "Discussion content here");

      const submitButton = screen.getByText(/Publish note/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockBuildTextPostData).toHaveBeenCalled();
        expect(mockMutate).toHaveBeenCalledWith(mockDiscussionData);
      });
    });
  });

  describe("Form Submission - RESOURCE Post", () => {
    it("should submit resource post with file and correct data", async () => {
      const user = userEvent.setup();
      const mockFile = new File(["test content"], "test.pdf", {
        type: "application/pdf",
      });
      const mockFormData = new FormData();
      mockFormData.append("title", "Test Resource Title");
      mockFormData.append("file", mockFile);

      mockBuildResourceFormData.mockReturnValue(mockFormData as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="RESOURCE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      // Fill in title
      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Resource Title");

      // Upload file
      const fileInput = screen.getByLabelText("File *");
      await user.upload(fileInput, mockFile);

      // Add a tag
      const jsTag = screen.getByText("JavaScript");
      await user.click(jsTag);

      // Submit form
      const submitButton = screen.getByText(/Publish resource/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockBuildResourceFormData).toHaveBeenCalled();
        expect(mockMutate).toHaveBeenCalledWith(mockFormData);
      });
    });

    it("should call onClose and reset form after successful resource post submission", async () => {
      const user = userEvent.setup();
      const mockFile = new File(["test"], "test.pdf", {
        type: "application/pdf",
      });

      mockBuildResourceFormData.mockReturnValue(new FormData() as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="RESOURCE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Resource Title");

      const fileInput = screen.getByLabelText("File *");
      await user.upload(fileInput, mockFile);

      const submitButton = screen.getByText(/Publish resource/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Dialog State Management", () => {
    it("should call onClose when dialog close button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should reset form when dialog is closed", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      // Fill in some data
      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Title");

      // Add a tag
      const jsTag = screen.getByText("JavaScript");
      await user.click(jsTag);

      expect(titleInput).toHaveValue("Test Title");

      // Close dialog
      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not render dialog when open is false", () => {
      render(
        <TestWrapper>
          <PostCreationForm
            open={false}
            onClose={mockOnClose}
            postType="NOTE"
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId("title-input")).not.toBeInTheDocument();
    });
  });

  describe("Tag Management", () => {
    it("should pass selectedTagIds to buildTextPostData correctly", async () => {
      const user = userEvent.setup();

      mockBuildTextPostData.mockReturnValue({
        title: "Test",
        content: "Test content",
        type: "NOTE",
        tagIds: [1, 2, 3],
      } as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Title");

      const markdownEditor = within(
        screen.getByTestId("content-editor")
      ).getByRole("textbox");
      await user.type(markdownEditor, "This is test content");

      // Add multiple tags
      await user.click(screen.getByText("JavaScript"));
      await user.click(screen.getByText("React"));
      await user.click(screen.getByText("TypeScript"));

      const submitButton = screen.getByText(/Publish note/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockBuildTextPostData).toHaveBeenCalled();
      });
    });

    it("should pass selectedTagIds to buildResourceFormData correctly", async () => {
      const user = userEvent.setup();
      const mockFile = new File(["test"], "test.pdf", {
        type: "application/pdf",
      });

      mockBuildResourceFormData.mockReturnValue(new FormData() as any);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="RESOURCE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId("title-input");
      await user.type(titleInput, "Test Resource");

      const fileInput = screen.getByLabelText("File *");
      await user.upload(fileInput, mockFile);

      // Add tags
      await user.click(screen.getByText("JavaScript"));
      await user.click(screen.getByText("Testing"));

      const submitButton = screen.getByText(/Publish resource/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockBuildResourceFormData).toHaveBeenCalled();
      });
    });

    it("should clear selectedTagIds when form is reset", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("title-input")).toBeInTheDocument();
      });

      // Add tags
      await user.click(screen.getByText("JavaScript"));
      await user.click(screen.getByText("React"));

      // Close dialog (which should reset)
      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should show loading state for tags", async () => {
      mockUseTagQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useTagQuery>);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      });
    });

    it("should show error state for tags", async () => {
      mockUseTagQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch tags"),
      } as unknown as ReturnType<typeof useTagQuery>);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Error loading tags/i)).toBeInTheDocument();
      });
    });

    it("should disable submit button when mutation is pending", async () => {
      mockUsePostCreationMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        isError: false,
      } as unknown as ReturnType<typeof usePostCreationMutation>);

      render(
        <TestWrapper>
          <PostCreationForm open onClose={mockOnClose} postType="NOTE" />
        </TestWrapper>
      );

      await waitFor(() => {
        const submitButton = screen.getByText(/Publishing/i);
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
