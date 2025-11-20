import { useCallback, useReducer } from "react";

import type { PostType } from "@/zodSchemas/post.zod";

type State =
  | { mode: "idle"; postType: null }
  | { mode: "chooseType"; postType: null }
  | { mode: "createPost"; postType: PostType };

type Action =
  | { type: "OPEN_TYPE_SELECTOR" }
  | { type: "SELECT_TYPE"; postType: PostType }
  | { type: "CLOSE" };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "OPEN_TYPE_SELECTOR":
      return { mode: "chooseType", postType: null };

    case "SELECT_TYPE":
      return { mode: "createPost", postType: action.postType };

    case "CLOSE":
      return { mode: "idle", postType: null };

    default:
      return state;
  }
};

/**
 * Custom hook for managing the post creation flow state machine.
 *
 * Handles the multi-step process of creating a post:
 * 1. User opens the post type selector modal
 * 2. User selects a post type (note, question, etc.)
 * 3. Post creation form opens with the selected type
 *
 * Uses a reducer pattern to ensure predictable state transitions and prevent
 * invalid states (e.g., having a post type selected without a modal open).
 *
 * @returns {Object} Post creation flow state and controls
 * @returns {boolean} isPostTypeModalOpen - Whether the post type selector modal is open
 * @returns {boolean} isPostCreationModalOpen - Whether the post creation form is open
 * @returns {PostType | null} postType - The currently selected post type (null if none selected)
 * @returns {Function} openPostTypeModal - Opens the post type selector modal
 * @returns {Function} selectPostType - Selects a post type and opens the creation form
 * @returns {Function} close - Closes all modals and resets the flow to idle state
 */
export const usePostCreationFlow = () => {
  const [state, dispatch] = useReducer(reducer, {
    mode: "idle",
    postType: null,
  });

  const openPostTypeModal = useCallback(
    () => dispatch({ type: "OPEN_TYPE_SELECTOR" }),
    []
  );

  const selectPostType = useCallback(
    (postType: PostType) => dispatch({ type: "SELECT_TYPE", postType }),
    []
  );

  const close = useCallback(() => dispatch({ type: "CLOSE" }), []);

  return {
    isPostTypeModalOpen: state.mode === "chooseType",
    isPostCreationModalOpen: state.mode === "createPost",
    postType: state.postType,

    openPostTypeModal,
    selectPostType,
    close,
  };
};
