import { useState, useCallback } from "react";

/**
 * Generic hook for managing modal state with associated data
 * Useful for detail modals, edit dialogs, etc.
 *
 * @template T - Type of data associated with the modal
 * @example
 * const reportModal = useModalState<Report>();
 * reportModal.open(selectedReport);
 * reportModal.close();
 */
export const useModalState = <T = unknown>() => {
  const [state, setState] = useState<{
    isOpen: boolean;
    data: T | null;
  }>({
    isOpen: false,
    data: null,
  });

  /**
   * Open modal with associated data
   */
  const open = useCallback((data: T) => {
    setState({ isOpen: true, data });
  }, []);

  /**
   * Close modal and clear data
   */
  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  /**
   * Update data without closing modal
   * Useful for inline edits in the modal
   */
  const updateData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  /**
   * Toggle modal state
   * If opening, requires data parameter
   */
  const toggle = useCallback((data?: T) => {
    setState((prev) => {
      if (prev.isOpen) {
        return { isOpen: false, data: null };
      }
      return { isOpen: true, data: data ?? null };
    });
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    updateData,
    toggle,
  };
};
