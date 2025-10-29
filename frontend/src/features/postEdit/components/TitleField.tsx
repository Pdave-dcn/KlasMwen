import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { Label } from "@radix-ui/react-label";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import type { UpdatePostData } from "@/queries/usePosts";

interface TitleFieldProps {
  control: Control<UpdatePostData>;
  errors: FieldErrors<UpdatePostData>;
}

const MIN_LENGTH = 5;
const MAX_LENGTH = 100;

export const TitleField = ({ control, errors }: TitleFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title" className="text-base font-semibold">
        Title
      </Label>
      <Controller
        name="title"
        control={control}
        rules={{
          required: "Title is required",
          minLength: {
            value: MIN_LENGTH,
            message: `Title must be at least ${MIN_LENGTH} characters`,
          },
          maxLength: {
            value: MAX_LENGTH,
            message: `Title must not exceed ${MAX_LENGTH} characters`,
          },
        }}
        render={({ field }) => (
          <div className="relative">
            <Input
              id="title"
              type="text"
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Enter post title"
            />
            <div className="absolute right-3 -bottom-7 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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
      {errors.title && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">
            {errors.title.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
