import { create } from "zustand";

import type { ResourceType } from "@/zodSchemas/report.zod";

interface ReportModalState {
  isOpen: boolean;
  resourceId: string | number | null;
  contentType: ResourceType | null;
  openReportModal: (resourceId: string | number) => void;
  closeReportModal: () => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  resourceId: null,
  contentType: null,
};

export const useReportModalStore = create<ReportModalState>((set) => ({
  ...initialState,

  openReportModal: (resourceId) => {
    const contentType = typeof resourceId === "string" ? "post" : "comment";

    set({
      isOpen: true,
      resourceId,
      contentType,
    });
  },

  closeReportModal: () => {
    set(initialState);
  },

  reset: () => {
    set(initialState);
  },
}));
