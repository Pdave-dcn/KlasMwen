import { useNavigate } from "react-router-dom";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateChatGroupMutation } from "@/queries/chat.query";
import type { CreateGroupFormData } from "@/zodSchemas/chat.zod";

import { CreateGroupForm } from "./CreateGroupForm";

export function CreateGroupPage() {
  const navigate = useNavigate();

  const createGroupMutation = useCreateChatGroupMutation();

  const handleSubmit = async (data: CreateGroupFormData) => {
    try {
      await createGroupMutation.mutateAsync(data);
      await navigate("/chat/groups");
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/chat/hub")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Create Group
              </h1>
              <p className="text-sm text-muted-foreground">
                Start your own study circle
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <CreateGroupForm
            onSubmit={handleSubmit}
            isSubmitting={createGroupMutation.isPending}
          />
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50">
          <h3 className="text-sm font-medium text-foreground mb-2">💡 Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Choose a clear, descriptive name for your group</li>
            <li>• Public groups can be discovered by other students</li>
            <li>• You can change settings later as the group owner</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
