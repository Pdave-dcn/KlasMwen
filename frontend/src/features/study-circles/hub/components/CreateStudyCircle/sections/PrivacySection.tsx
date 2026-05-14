import { motion } from "framer-motion";

import { PrivacyOption } from "../PrivacyOption";

import { SectionHeader } from "./SectionHeader";

interface PrivacySectionProps {
  privacySelection: boolean;
  onPrivacyChange: (isPrivate: boolean) => void;
  variants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number };
  };
}

export function PrivacySection({
  privacySelection,
  onPrivacyChange,
  variants,
}: PrivacySectionProps) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.3, delay: 0.2 }}
      className="space-y-4"
    >
      <SectionHeader number={3} title="Privacy" />

      <div className="grid grid-cols-2 gap-3">
        <PrivacyOption
          type="public"
          isSelected={privacySelection}
          onClick={() => onPrivacyChange(true)}
        />

        <PrivacyOption
          type="private"
          isSelected={!privacySelection}
          onClick={() => onPrivacyChange(false)}
        />
      </div>
    </motion.div>
  );
}
