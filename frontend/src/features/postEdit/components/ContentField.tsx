import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { Label } from "@radix-ui/react-label";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { UpdatePostData } from "@/queries/post.query";

interface ContentFieldProps {
  control: Control<UpdatePostData>;
  errors: FieldErrors<UpdatePostData>;
}

const MIN_LENGTH = 20;
const MAX_LENGTH = 5000;

export const ContentField = ({ control, errors }: ContentFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="content" className="text-base font-semibold">
        Content
      </Label>
      <Controller
        name="content"
        control={control}
        rules={{
          required: "Content is required",
          minLength: {
            value: MIN_LENGTH,
            message: `Content must be at least ${MIN_LENGTH} characters`,
          },
          maxLength: {
            value: MAX_LENGTH,
            message: `Content must not exceed ${MAX_LENGTH} characters`,
          },
          validate: {
            notEmpty: (value) => {
              const trimmed = value?.trim() ?? "";
              return trimmed.length > 0 || "Content cannot be empty";
            },
          },
        }}
        render={({ field }) => (
          <div className="relative rounded-md border overflow-hidden">
            <MDEditor
              id="content"
              aria-label="Content"
              data-testid="content-editor"
              value={field.value ?? ""}
              onChange={(val) => field.onChange(val ?? "")}
              height={350}
              preview="edit"
            />

            <div className="absolute right-1 bottom-2.5 text-right text-xs text-muted-foreground pointer-events-none">
              <span
                className={
                  (field.value?.length ?? 0) > MAX_LENGTH ? "text-red-500" : ""
                }
              >
                {field.value?.length ?? 0}
              </span>
              /{MAX_LENGTH}
            </div>
          </div>
        )}
      />
      {errors.content && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">
            {errors.content.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
