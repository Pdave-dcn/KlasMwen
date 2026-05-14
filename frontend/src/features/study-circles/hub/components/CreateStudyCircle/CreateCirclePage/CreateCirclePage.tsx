import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { useCreateStudyCircleMutation } from "@/queries/circle";
import type { CreateCircleFormData } from "@/zodSchemas/circle.zod";

import { CreateCircleContent } from "./CreateCircleContent";
import { CreateCircleHeader } from "./CreateCircleHeader";
import { CreateCircleSuccess } from "./CreateCircleSuccess";

export function CreateCirclePage() {
  const navigate = useNavigate();
  const createGroupMutation = useCreateStudyCircleMutation();

  const [createdGroupName, setCreatedGroupName] = useState<string | null>(null);

  const handleSubmit = async (data: CreateCircleFormData) => {
    try {
      await createGroupMutation.mutateAsync({
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
        tagIds: data.tagIds,
      });

      setCreatedGroupName(data.name);

      toast.info("Group created!", {
        description: `"${data.name}" is ready to go.`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: "Failed to create group. Please try again.",
      });
    }
  };

  const handleCreateAnother = () => {
    setCreatedGroupName(null);
  };

  // Success State
  if (createdGroupName) {
    return (
      <CreateCircleSuccess
        circleName={createdGroupName}
        onGoToChat={() => navigate("/circles/mine")}
        onCreateAnother={handleCreateAnother}
        onBackToHub={() => navigate("/circles")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CreateCircleHeader onBack={() => navigate("/circles")} />

      <CreateCircleContent
        onSubmit={handleSubmit}
        isSubmitting={createGroupMutation.isPending}
      />
    </div>
  );
}
