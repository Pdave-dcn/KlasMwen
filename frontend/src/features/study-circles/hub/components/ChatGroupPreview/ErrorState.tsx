import { useNavigate } from "react-router-dom";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export const DetailError = ({ onRefetch }: { onRefetch: () => void }) => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-sm w-full gap-6">
        {/* Icon container */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle
              className="w-9 h-9 text-destructive"
              strokeWidth={1.5}
            />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive animate-ping opacity-40" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">
            Couldn't load this group
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Something went wrong while fetching the group details. This might be
            a temporary issue — try again or head back.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
          <Button className="flex-1 gap-2" onClick={onRefetch}>
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
};
