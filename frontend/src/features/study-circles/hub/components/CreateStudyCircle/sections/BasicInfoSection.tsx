import { type FieldErrors, Controller, type Control } from "react-hook-form";

import { motion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type CreateCircleFormData } from "@/zodSchemas/circle.zod";

import { FormField } from "../FormField";

import { SectionHeader } from "./SectionHeader";

interface BasicInfoSectionProps {
  control: Control<CreateCircleFormData>;
  errors: FieldErrors<CreateCircleFormData>;
  variants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number };
  };
}

const NAME_MAX = 50;
const DESC_MAX = 200;

export function BasicInfoSection({
  control,
  errors,
  variants,
}: BasicInfoSectionProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: 0 }}
      className="space-y-5"
    >
      <SectionHeader number={1} title="Basic Info" />

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FormField
            label="Group Name"
            required
            error={errors.name?.message}
            characterCount={{
              current: field.value.length,
              max: NAME_MAX,
            }}
          >
            <Input
              placeholder="e.g., Calculus Study Circle"
              {...field}
              className="h-12 rounded-xl"
              maxLength={NAME_MAX}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <FormField
            label="Description"
            optional
            error={errors.description?.message}
            characterCount={{
              current: field.value?.length ?? 0,
              max: DESC_MAX,
            }}
          >
            <Textarea
              placeholder="What's your group about?"
              className="resize-none min-h-25 rounded-xl"
              {...field}
              maxLength={DESC_MAX}
            />
          </FormField>
        )}
      />
    </motion.div>
  );
}
