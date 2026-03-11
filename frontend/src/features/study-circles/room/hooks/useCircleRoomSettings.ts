import { useState } from "react";

export const useCircleRoomSettings = () => {
  const [showSettings, setShowSettings] = useState(false);

  return {
    showSettings,
    setShowSettings,
    onOpen: () => setShowSettings(true),
    onClose: () => setShowSettings(false),
  };
};
