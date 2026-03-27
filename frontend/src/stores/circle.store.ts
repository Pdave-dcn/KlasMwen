import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { User } from "@/types/auth.type";
import type { StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

interface CircleStoreState {
  // Selection state
  selectedCircleId: string | null;
  selectCircle: (circleId: string | null) => void;

  // Resets the selected circle (used after leaving, deleting or unmounting a circle to clear stale data)
  resetSelectedCircle: () => void;

  // Current user context
  currentUser: User | null;
  setCurrentUser: (user: User) => void;

  // Current user's role in the selected circle (OWNER, MODERATOR, MEMBER, or null if not a member)
  currentUserMemberRole: MemberRole | null;
  setCurrentUserMemberRole: (role: MemberRole | null) => void;

  // Room online state
  onlineMemberIds: Set<string>;
  setOnlineMembers: (userIds: string[]) => void;
  clearOnlineMembers: () => void;

  // Room Presence (Who is currently looking at the chat room)
  presentMemberIds: Set<string>;
  setMemberJoined: (userId: string) => void;
  setMemberLeft: (userId: string) => void;
  setPresentMembers: (userIds: string[]) => void;
  clearPresence: () => void;
}

export const useCircleStore = create<CircleStoreState>()(
  devtools((set) => ({
    // Selection
    selectedCircleId: null,
    selectCircle: (circleId) => {
      set(
        { selectedCircleId: circleId, presentMemberIds: new Set() },
        false,
        "CircleStore/selectCircle",
      );
    },
    resetSelectedCircle: () =>
      set(
        { selectedCircleId: null, presentMemberIds: new Set() },
        false,
        "CircleStore/resetSelectedCircle",
      ),

    // Current user
    currentUser: null,
    currentUserMemberRole: null,
    setCurrentUserMemberRole: (role) =>
      set(
        { currentUserMemberRole: role },
        false,
        "CircleStore/setCurrentUserMemberRole",
      ),
    setCurrentUser: (user) =>
      set({ currentUser: user }, false, "CircleStore/setCurrentUser"),

    // Room online state
    onlineMemberIds: new Set(),
    setOnlineMembers(userIds) {
      set(
        { onlineMemberIds: new Set(userIds) },
        false,
        "CircleStore/setOnlineMembers",
      );
    },
    clearOnlineMembers: () =>
      set(
        { onlineMemberIds: new Set() },
        false,
        "CircleStore/clearOnlineMembers",
      ),

    // Room Presence
    presentMemberIds: new Set(),
    setPresentMembers: (userIds) =>
      set(
        { presentMemberIds: new Set(userIds) },
        false,
        "CircleStore/setPresentMembers",
      ),

    setMemberJoined: (id) =>
      set(
        (state) => ({
          presentMemberIds: new Set(state.presentMemberIds).add(id),
        }),
        false,
        "CircleStore/setMemberJoined",
      ),

    setMemberLeft: (id) =>
      set(
        (state) => {
          const next = new Set(state.presentMemberIds);
          next.delete(id);
          return { presentMemberIds: next };
        },
        false,
        "CircleStore/setMemberLeft",
      ),

    clearPresence: () =>
      set({ presentMemberIds: new Set() }, false, "CircleStore/clearPresence"),
  })),
);
