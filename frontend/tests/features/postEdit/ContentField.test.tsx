import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContentField } from "@/features/postEdit/components/ContentField";
import type { UpdatePostData } from "@/queries/post.query";

// Mock the MDEditor component
vi.mock("@uiw/react-md-editor", () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="md-editor"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Content"
    />
  ),
}));

// Wrapper component to provide form context
const TestWrapper = ({
  defaultValues = {},
  children,
}: {
  defaultValues?: Partial<UpdatePostData>;
  children: (control: any, errors: any) => React.ReactNode;
}) => {
  const {
    control,
    formState: { errors },
  } = useForm<UpdatePostData>({
    defaultValues: {
      title: "",
      content: "",
      tagIds: [],
      type: "NOTE",
      ...defaultValues,
    },
    mode: "onChange",
  });

  return <>{children(control, errors)}</>;
};

describe("ContentField Component", () => {
  describe("Rendering", () => {
    it("should render the content field with label", () => {
      render(
        <TestWrapper>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByTestId("md-editor")).toBeInTheDocument();
    });

    it("should display character counter at 0/5000", () => {
      render(
        <TestWrapper>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("/5000")).toBeInTheDocument();
    });

    it("should render with initial content value", () => {
      render(
        <TestWrapper defaultValues={{ content: "Initial content here" }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      expect(
        screen.getByDisplayValue("Initial content here")
      ).toBeInTheDocument();
    });
  });

  describe("Character Counter", () => {
    it("should update character count as user types", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      const editor = screen.getByTestId("md-editor");
      await user.type(editor, "Hello World");

      await waitFor(() => {
        expect(screen.getByText("11")).toBeInTheDocument();
      });
    });

    it("should show red text when exceeding max length", () => {
      const longContent = "a".repeat(5001);

      render(
        <TestWrapper defaultValues={{ content: longContent }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      const counter = screen.getByText("5001");
      expect(counter).toHaveClass("text-red-500");
    });

    it("should not show red text when within max length", () => {
      const validContent = "a".repeat(100);

      render(
        <TestWrapper defaultValues={{ content: validContent }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      const counter = screen.getByText("100");
      expect(counter).not.toHaveClass("text-red-500");
    });
  });

  describe("Validation - Required", () => {
    it("should show error when content is empty and form is submitted", async () => {
      const user = userEvent.setup();

      const TestFormWrapper = () => {
        const {
          control,
          handleSubmit,
          formState: { errors },
        } = useForm<UpdatePostData>({
          defaultValues: { content: "" },
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <ContentField control={control} errors={errors} />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<TestFormWrapper />);

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Content is required")).toBeInTheDocument();
      });
    });

    it("should show error when content is only whitespace", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {(control, errors) => (
            <form>
              <ContentField control={control} errors={errors} />
              <button type="submit">Submit</button>
            </form>
          )}
        </TestWrapper>
      );

      const editor = screen.getByTestId("md-editor");
      await user.type(editor, "                    ");

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Content cannot be empty")).toBeInTheDocument();
      });
    });
  });

  describe("Validation - Minimum Length", () => {
    it("should show error when content is less than 20 characters", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {(control, errors) => (
            <form>
              <ContentField control={control} errors={errors} />
              <button type="submit">Submit</button>
            </form>
          )}
        </TestWrapper>
      );

      const editor = screen.getByTestId("md-editor");
      await user.type(editor, "Short");

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Content must be at least 20 characters")
        ).toBeInTheDocument();
      });
    });

    it("should not show error when content is exactly 20 characters", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ content: "12345678901234567890" }}>
          {(control, errors) => (
            <form>
              <ContentField control={control} errors={errors} />
              <button type="submit">Submit</button>
            </form>
          )}
        </TestWrapper>
      );

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Content must be at least 10 characters")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Validation - Maximum Length", () => {
    it("should show error when content exceeds 5000 characters", async () => {
      const user = userEvent.setup();
      const longContent = "a".repeat(5001);

      const TestFormWrapper = () => {
        const {
          control,
          handleSubmit,
          formState: { errors },
        } = useForm<UpdatePostData>({
          defaultValues: { content: longContent },
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <ContentField control={control} errors={errors} />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<TestFormWrapper />);

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Content must not exceed 5000 characters")
        ).toBeInTheDocument();
      });
    });
  });

  describe("User Interaction", () => {
    it("should update content value when user types", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      const editor = screen.getByTestId("md-editor");
      await user.type(editor, "This is my test content");

      expect(
        screen.getByDisplayValue("This is my test content")
      ).toBeInTheDocument();
    });

    it("should handle clearing content", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ content: "Initial content" }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      const editor = screen.getByTestId("md-editor");
      await user.clear(editor);

      expect(editor).toHaveValue("");
    });

    it("should handle updating existing content", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper defaultValues={{ content: "Original content" }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      const editor = screen.getByTestId("md-editor");
      await user.clear(editor);
      await user.type(editor, "Updated content here");

      expect(
        screen.getByDisplayValue("Updated content here")
      ).toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    it("should display validation error in alert component", async () => {
      const user = userEvent.setup();

      const TestFormWrapper = () => {
        const {
          control,
          handleSubmit,
          formState: { errors },
        } = useForm<UpdatePostData>({
          defaultValues: { content: "" },
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <ContentField control={control} errors={errors} />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<TestFormWrapper />);

      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent("Content is required");
      });
    });

    it("should clear error when valid content is entered", async () => {
      const user = userEvent.setup();

      const TestFormWrapper = () => {
        const {
          control,
          handleSubmit,
          formState: { errors },
        } = useForm<UpdatePostData>({
          defaultValues: { content: "" },
          mode: "onChange",
        });

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <ContentField control={control} errors={errors} />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(<TestFormWrapper />);

      // Trigger error
      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Content is required")).toBeInTheDocument();
      });

      // Fix error by entering valid content (20+ characters)
      const editor = screen.getByTestId("md-editor");
      await user.type(
        editor,
        "Now this is valid content with more than 20 characters"
      );

      await waitFor(
        () => {
          expect(
            screen.queryByText("Content is required")
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should not display error when content is valid", () => {
      render(
        <TestWrapper defaultValues={{ content: "Valid content here" }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined content value", () => {
      render(
        <TestWrapper defaultValues={{ content: undefined }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      expect(screen.getByTestId("md-editor")).toHaveValue("");
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle null content value", () => {
      render(
        <TestWrapper defaultValues={{ content: null as any }}>
          {(control, errors) => (
            <ContentField control={control} errors={errors} />
          )}
        </TestWrapper>
      );

      expect(screen.getByTestId("md-editor")).toHaveValue("");
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
