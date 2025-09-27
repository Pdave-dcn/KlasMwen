import { RefreshCw } from "lucide-react";

import { Button, type buttonVariants } from "./ui/button";

import type { VariantProps } from "class-variance-authority";

interface LoadMoreButtonProps {
  isLoading: boolean;
  onClick: () => void;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  style?: string;
}

const LoadMoreButton = ({
  isLoading,
  onClick,
  variant = "outline",
  style,
}: LoadMoreButtonProps) => (
  <Button
    variant={variant}
    onClick={onClick}
    disabled={isLoading}
    className={`w-full ${style}`}
  >
    {isLoading ? (
      <>
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading more...
      </>
    ) : (
      "Load more"
    )}
  </Button>
);

export default LoadMoreButton;
