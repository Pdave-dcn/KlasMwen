import type { FieldErrors, useForm } from "react-hook-form";

import { Label } from "@radix-ui/react-label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import type { PostFormValues, PostType } from "@/zodSchemas/post.zod";

interface TitleFieldProps {
  register: ReturnType<typeof useForm<PostFormValues>>["register"];
  errors: FieldErrors<PostFormValues>;
  postType: PostType | null;
}

const TitleField = ({ register, errors, postType }: TitleFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor="title" className="text-base font-semibold">
      Title *
    </Label>
    <Input
      id="title"
      type="text"
      {...register("title")}
      placeholder={`Enter your ${postType?.toLowerCase()} title...`}
      className="text-base"
    />
    {errors.title && (
      <Alert variant="destructive" className="py-2">
        <AlertDescription className="text-sm">
          {errors.title.message}
        </AlertDescription>
      </Alert>
    )}
  </div>
);

export default TitleField;
