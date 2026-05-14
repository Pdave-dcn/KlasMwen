import { CheckCircle, MessageSquare, Plus } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

interface CreateCircleSuccessProps {
  circleName: string;
  onGoToChat: () => void;
  onCreateAnother: () => void;
  onBackToHub: () => void;
}

export function CreateCircleSuccess({
  circleName,
  onGoToChat,
  onCreateAnother,
  onBackToHub,
}: CreateCircleSuccessProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Group Created!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your group "{circleName}" is ready. What would you like to do next?
        </p>

        <div className="space-y-3">
          <Button className="w-full h-12 rounded-xl" onClick={onGoToChat}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Go to Chat
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={onCreateAnother}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Another Group
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12 rounded-xl"
            onClick={onBackToHub}
          >
            Back to Chat Hub
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
