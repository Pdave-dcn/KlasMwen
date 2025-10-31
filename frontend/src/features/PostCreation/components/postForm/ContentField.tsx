import { useEffect } from "react";

import type {
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { PostFormValues, TextPostData } from "@/zodSchemas/post.zod";

interface ContentFieldProps {
  setValue: UseFormSetValue<PostFormValues>;
  watch: UseFormWatch<PostFormValues>;
  errors: FieldErrors<PostFormValues>;
}

const MAX_LENGTH = 5000;

const ContentField = ({ setValue, watch, errors }: ContentFieldProps) => {
  const content = watch("content") ?? "";

  useEffect(() => {
    if (content === undefined) setValue("content", "");
  }, [content, setValue]);

  return (
    <div className="space-y-2">
      <Label htmlFor="content" className="text-base font-semibold">
        Content *
      </Label>

      <div className="relative rounded-md border overflow-hidden">
        <MDEditor
          aria-label="Content"
          data-testid="content-editor"
          value={content}
          onChange={(val) => setValue("content", val ?? "")}
          height={350}
          preview="edit"
        />

        <div className="absolute right-1 bottom-2.5 text-right text-xs text-muted-foreground">
          <span className={content.length > MAX_LENGTH ? "text-red-500" : ""}>
            {content.length}
          </span>
          /{MAX_LENGTH}
        </div>
      </div>

      {(errors as FieldErrors<TextPostData>).content && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">
            {(errors as FieldErrors<TextPostData>).content?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ContentField;
