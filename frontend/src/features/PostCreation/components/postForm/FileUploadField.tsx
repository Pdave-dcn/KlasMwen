import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Label } from "@radix-ui/react-label";
import { Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PostFormValues, ResourcePostData } from "@/zodSchemas/post.zod";

interface FileUploadFieldProps {
  register: UseFormRegister<PostFormValues>;
  errors: FieldErrors<PostFormValues>;
  resourceFile?: File;
}

const FileUploadField = ({
  register,
  errors,
  resourceFile,
}: FileUploadFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor="resource" className="text-base font-semibold">
      File *
    </Label>
    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
      <input
        id="resource"
        type="file"
        {...register("resource")}
        className="hidden"
      />
      <Label
        htmlFor="resource"
        className="cursor-pointer flex flex-col items-center"
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        {resourceFile ? (
          <div>
            <p className="text-base font-medium">{resourceFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(resourceFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-base font-medium mb-2">Click to upload a file</p>
            <p className="text-sm text-muted-foreground">
              Or drag and drop your file here
            </p>
          </div>
        )}
      </Label>
    </div>
    {(errors as FieldErrors<ResourcePostData>).resource && (
      <Alert variant="destructive" className="py-2">
        <AlertDescription className="text-sm">
          {(errors as FieldErrors<ResourcePostData>).resource?.message}
        </AlertDescription>
      </Alert>
    )}
  </div>
);

export default FileUploadField;
