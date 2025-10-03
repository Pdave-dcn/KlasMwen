import type { FieldErrors, useForm } from "react-hook-form";

import { Label } from "@radix-ui/react-label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import type {
  PostFormValues,
  PostType,
  TextPostData,
} from "@/zodSchemas/post.zod";

interface ContentFieldProps {
  register: ReturnType<typeof useForm<PostFormValues>>["register"];
  errors: FieldErrors<PostFormValues>;
  postType: PostType | null;
}

const ContentField = ({ register, errors, postType }: ContentFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor="content" className="text-base font-semibold">
      Content *
    </Label>
    <Textarea
      id="content"
      {...register("content")}
      placeholder={`Write your ${postType?.toLowerCase()} content here...`}
      className="text-base resize-none min-h-[150px]"
    />
    {(errors as FieldErrors<TextPostData>).content && (
      <Alert variant="destructive" className="py-2">
        <AlertDescription className="text-sm">
          {(errors as FieldErrors<TextPostData>).content?.message}
        </AlertDescription>
      </Alert>
    )}
  </div>
);

export default ContentField;
