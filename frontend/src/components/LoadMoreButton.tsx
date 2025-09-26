import { RefreshCw } from "lucide-react";

import { Button } from "./ui/button";

const LoadMoreButton = ({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) => (
  <Button
    variant="outline"
    onClick={onClick}
    disabled={isLoading}
    className="w-full mt-6"
  >
    {isLoading ? (
      <>
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        Loading more...
      </>
    ) : (
      "Load more"
    )}
  </Button>
);

export default LoadMoreButton;
