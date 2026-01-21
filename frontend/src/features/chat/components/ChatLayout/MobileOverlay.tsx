interface MobileOverlayProps {
  onClose: () => void;
}

export const MobileOverlay = ({ onClose }: MobileOverlayProps) => (
  <div
    className="fixed inset-0 bg-black/20 z-30"
    onClick={onClose}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        onClose();
      }
    }}
  />
);
