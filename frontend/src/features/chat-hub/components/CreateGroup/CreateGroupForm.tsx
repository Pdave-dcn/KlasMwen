import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CreateChatGroupSchema,
  type CreateGroupFormData,
} from "@/zodSchemas/chat.zod";

import { FormField } from "./FormField";
import { PrivacyOption } from "./PrivacyOption";

interface CreateGroupFormProps {
  onSubmit: (data: CreateGroupFormData) => void;
  isSubmitting: boolean;
}

export function CreateGroupForm({
  onSubmit,
  isSubmitting,
}: CreateGroupFormProps) {
  const [isPrivate, setIsPrivate] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(CreateChatGroupSchema),
    defaultValues: {
      name: "",
      description: undefined,
      isPrivate: false,
    },
  });

  const handlePrivacyChange = (newIsPrivate: boolean) => {
    setIsPrivate(newIsPrivate);
    setValue("isPrivate", newIsPrivate);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Group Name */}
      <FormField
        label="Group Name *"
        htmlFor="name"
        error={errors.name?.message}
      >
        <Input
          id="name"
          placeholder="e.g., Calculus Study Circle"
          className="h-12"
          {...register("name")}
        />
      </FormField>

      {/* Description */}
      <FormField
        label="Description (optional)"
        htmlFor="description"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          placeholder="What's your group about?"
          className="resize-none min-h-25"
          {...register("description")}
        />
      </FormField>

      {/* Privacy Toggle */}
      <div className="space-y-3">
        <FormField label="Privacy">
          <input type="hidden" {...register("isPrivate")} />
          <div className="grid grid-cols-2 gap-3">
            <PrivacyOption
              type="public"
              isSelected={!isPrivate}
              onClick={() => handlePrivacyChange(false)}
            />
            <PrivacyOption
              type="private"
              isSelected={isPrivate}
              onClick={() => handlePrivacyChange(true)}
            />
          </div>
        </FormField>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Group...
          </>
        ) : (
          "Create Group"
        )}
      </Button>
    </form>
  );
}
