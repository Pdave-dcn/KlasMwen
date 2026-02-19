import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { JoinButton, type JoinButtonProps } from "./JoinButton";

export type ActionBarProps = JoinButtonProps & {
  onShare: () => void;
};

export const DesktopSidebar = ({ onShare, ...joinProps }: ActionBarProps) => (
  <div className="hidden md:flex flex-col w-72 gap-4 sticky top-20 self-start">
    <JoinButton {...joinProps} className="w-full h-12" />
    <Button
      variant="outline"
      size="lg"
      className="w-full h-12 rounded-xl text-sm"
      onClick={onShare}
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share Group
    </Button>
  </div>
);

export const MobileBottomBar = ({ onShare, ...joinProps }: ActionBarProps) => (
  <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/90 backdrop-blur border-t border-border px-4 py-3 flex items-center gap-3">
    <JoinButton {...joinProps} className="flex-1 h-12" />
    <Button
      variant="outline"
      size="icon"
      className="h-12 w-12 rounded-xl shrink-0"
      onClick={onShare}
    >
      <Share2 className="w-4 h-4" />
    </Button>
  </div>
);
