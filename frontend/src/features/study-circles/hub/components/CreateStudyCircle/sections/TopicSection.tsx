import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { motion } from "motion/react";

import { TagSelector } from "@/components/TagSelector";
import { type CreateCircleFormData } from "@/zodSchemas/circle.zod";

import { FormField } from "../FormField";

import { SectionHeader } from "./SectionHeader";

interface TopicsSectionProps {
  control: Control<CreateCircleFormData>;
  errors: FieldErrors<CreateCircleFormData>;
  variants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number };
  };
}

export function TopicsSection({
  control,
  errors,
  variants,
}: TopicsSectionProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-4"
    >
      <SectionHeader number={2} title="Topics & Tags" />

      <Controller
        control={control}
        name="tagIds"
        render={({ field }) => (
          <FormField
            label="Select topics so students can find your group"
            error={errors.tagIds?.message}
          >
            <TagSelector
              selectedTagIds={field.value ?? []}
              onChange={(tagIds) => {
                field.onChange(tagIds);
              }}
            />
          </FormField>
        )}
      />
    </motion.div>
  );
}
