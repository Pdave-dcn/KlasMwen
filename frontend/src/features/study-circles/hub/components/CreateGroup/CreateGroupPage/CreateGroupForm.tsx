import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CreateChatGroupSchema,
  type CreateGroupFormData,
} from "@/zodSchemas/chat.zod";

import { BasicInfoSection } from "../sections/BasicInfoSection";
import { PrivacySection } from "../sections/PrivacySection";
import { TopicsSection } from "../sections/TopicSection";

interface CreateGroupFormProps {
  onSubmit: (data: CreateGroupFormData) => Promise<void>;
  isSubmitting: boolean;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function CreateGroupForm({
  onSubmit,
  isSubmitting,
}: CreateGroupFormProps) {
  const [privacySelection, setPrivacySelection] = useState<boolean>(true);

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(CreateChatGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: true,
      tagIds: [],
    },
  });

  const handlePrivacyChange = (isPrivate: boolean) => {
    setPrivacySelection(isPrivate);
    form.setValue("isPrivate", isPrivate);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Section 1: Basic Info */}
      <BasicInfoSection
        control={form.control}
        errors={form.formState.errors}
        variants={sectionVariants}
      />

      {/* Section 2: Topics & Tags */}
      <TopicsSection
        control={form.control}
        errors={form.formState.errors}
        variants={sectionVariants}
      />

      {/* Section 3: Privacy */}
      <PrivacySection
        privacySelection={privacySelection}
        onPrivacyChange={handlePrivacyChange}
        variants={sectionVariants}
      />

      {/* Submit */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-200 text-primary-foreground font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Group...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Create Group
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
}
