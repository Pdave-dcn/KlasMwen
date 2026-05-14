import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ─────────────────────────────────────────────────────────────

const mockPresenceStore = vi.hoisted(() => ({
  onlineUsers: new Set<string>(),
}));

const mockCircleStore = vi.hoisted(() => ({
  onlineMemberIds: new Set<string>(),
  presentMemberIds: new Set<string>(),
}));

vi.mock("@/stores/presence.store", () => ({
  usePresenceStore: vi.fn(
    (selector: (state: typeof mockPresenceStore) => any) =>
      selector(mockPresenceStore),
  ),
}));

vi.mock("@/stores/circle.store", () => ({
  useCircleStore: vi.fn((selector: (state: typeof mockCircleStore) => any) =>
    selector(mockCircleStore),
  ),
}));

// IntersectionObserver is not available in jsdom — mock it so useInfiniteScroll
// doesn't throw when MemberList mounts in tests
vi.stubGlobal(
  "IntersectionObserver",
  vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
);

import { MemberList } from "@/features/study-circles/room/components/MemberList/MemberList";
import { MemberItem } from "@/features/study-circles/room/components/MemberList/MemberItem";
import type { CircleMember } from "@/zodSchemas/circle.zod";

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<CircleMember> = {}): CircleMember {
  return {
    userId: "user-1",
    circleId: "circle-1",
    role: "MEMBER",
    isMuted: false,
    user: {
      id: "user-1",
      username: "alice",
      avatar: null,
    },
    ...overrides,
  } as CircleMember;
}

// Default pagination — no more pages, nothing fetching
const defaultPagination = {
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function renderMemberItem(member: CircleMember, isCurrentUser = false) {
  return render(<MemberItem member={member} isCurrentUser={isCurrentUser} />);
}

function renderMemberList(
  members: CircleMember[],
  isLoading = false,
  currentUserId?: string,
) {
  return render(
    <MemberList
      members={members}
      isLoading={isLoading}
      currentUserId={currentUserId}
      pagination={defaultPagination}
    />,
  );
}

describe("MemberItem & MemberList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPresenceStore.onlineUsers = new Set();
    mockCircleStore.onlineMemberIds = new Set();
    mockCircleStore.presentMemberIds = new Set();
  });

  // ── state-to-visual mapping ───────────────────────────────────────────────

  describe("state-to-visual mapping", () => {
    describe("offline user", () => {
      it("shows the muted status dot when user is offline", () => {
        const member = makeMember({ userId: "user-offline" });
        renderMemberItem(member);

        const dot = screen.getByTestId("online-status-indicator");
        expect(dot.className).toContain("bg-muted-foreground/50");
      });

      it("does not render presence indicator ring for offline user", () => {
        const member = makeMember({ userId: "user-offline" });
        renderMemberItem(member);

        expect(screen.queryByTestId("presence-indicator")).toBeNull();
      });

      it("does not render present text label for offline user", () => {
        const member = makeMember({ userId: "user-offline" });
        renderMemberItem(member);

        expect(screen.queryByTestId("present-text-indicator")).toBeNull();
      });
    });

    describe("online user (global presence)", () => {
      it("shows the emerald status dot when user is in onlineUsers", () => {
        mockPresenceStore.onlineUsers = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member);

        const dot = screen.getByTestId("online-status-indicator");
        expect(dot.className).toContain("bg-emerald-500");
      });

      it("shows emerald dot when user is in circle onlineMemberIds", () => {
        mockCircleStore.onlineMemberIds = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member);

        const dot = screen.getByTestId("online-status-indicator");
        expect(dot.className).toContain("bg-emerald-500");
      });

      it("does not show presence ring for merely online (non-present) user", () => {
        mockPresenceStore.onlineUsers = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member);

        expect(screen.queryByTestId("presence-indicator")).toBeNull();
      });
    });

    describe("present user", () => {
      it("renders the pulsing presence ring when user is present", () => {
        mockCircleStore.presentMemberIds = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member, false);

        expect(screen.getByTestId("presence-indicator")).toBeDefined();
      });

      it("renders the 'Present' text label when user is present and not current user", () => {
        mockCircleStore.presentMemberIds = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member, false);

        const label = screen.getByTestId("present-text-indicator");
        expect(label).toBeDefined();
        expect(label.textContent).toContain("Present");
      });

      it("does not show 'Present' text label for the current user even if present", () => {
        mockCircleStore.presentMemberIds = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member, true);

        expect(screen.queryByTestId("present-text-indicator")).toBeNull();
      });

      it("still renders the presence ring for the current user when present", () => {
        mockCircleStore.presentMemberIds = new Set(["user-1"]);
        const member = makeMember({ userId: "user-1" });
        renderMemberItem(member, true);

        expect(screen.getByTestId("presence-indicator")).toBeDefined();
      });
    });
  });

  // ── identity logic ────────────────────────────────────────────────────────

  describe("identity logic", () => {
    it("appends '(You)' to the username for the current user", () => {
      const member = makeMember({
        user: { id: "me", username: "bob", avatar: null } as any,
      });
      renderMemberItem(member, true);

      expect(screen.getByText(/bob \(You\)/)).toBeDefined();
    });

    it("applies text-primary class to the username for the current user", () => {
      const member = makeMember({
        user: { id: "me", username: "bob", avatar: null } as any,
      });
      renderMemberItem(member, true);

      const usernameEl = screen.getByText(/bob \(You\)/);
      expect(usernameEl.className).toContain("text-primary");
    });

    it("does not append '(You)' for non-current users", () => {
      const member = makeMember({
        user: { id: "other", username: "carol", avatar: null } as any,
      });
      renderMemberItem(member, false);

      expect(screen.queryByText(/carol \(You\)/)).toBeNull();
      expect(screen.getByText("carol")).toBeDefined();
    });

    it("does not apply text-primary to username for non-current users", () => {
      const member = makeMember({
        user: { id: "other", username: "carol", avatar: null } as any,
      });
      renderMemberItem(member, false);

      const usernameEl = screen.getByText("carol");
      expect(usernameEl.className).not.toContain("text-primary");
    });

    it("MemberList passes isCurrentUser correctly based on currentUserId prop", () => {
      const member = makeMember({
        userId: "me",
        user: { id: "me", username: "dave", avatar: null } as any,
      });
      renderMemberList([member], false, "me");

      expect(screen.getByText(/dave \(You\)/)).toBeDefined();
    });
  });

  // ── avatar fallbacks ──────────────────────────────────────────────────────

  describe("avatar fallbacks", () => {
    it("displays initials when user has no avatar", () => {
      const member = makeMember({
        user: { id: "u1", username: "Alice Smith", avatar: null } as any,
      });
      renderMemberItem(member);

      expect(screen.getByText("AL")).toBeDefined();
    });

    it("applies a background color derived from the first character of the username", () => {
      const member = makeMember({
        user: { id: "u1", username: "alice", avatar: null } as any,
      });
      renderMemberItem(member);

      const avatar = screen.getByTestId("user-avatar");
      const initials = avatar.querySelector("div");
      expect(initials?.className).toContain("bg-emerald-500");
    });

    it("applies a different background color for a different starting character", () => {
      const member = makeMember({
        user: { id: "u2", username: "carol", avatar: null } as any,
      });
      renderMemberItem(member);

      const avatar = screen.getByTestId("user-avatar");
      const initials = avatar.querySelector("div");
      expect(initials?.className).toContain("bg-rose-500");
    });

    it("renders an img tag instead of initials when avatar URL is present", () => {
      const member = makeMember({
        user: {
          id: "u1",
          username: "alice",
          avatar: { url: "https://example.com/avatar.jpg" },
        } as any,
      });
      renderMemberItem(member);

      const img = screen.getByRole("img");
      expect(img).toBeDefined();
      expect((img as HTMLImageElement).src).toBe(
        "https://example.com/avatar.jpg",
      );
    });
  });

  // ── loading state ─────────────────────────────────────────────────────────

  describe("loading state", () => {
    it("renders LoadingState instead of member list when isLoading is true", () => {
      const member = makeMember();
      renderMemberList([member], true);

      expect(screen.queryByTestId("role-indicator")).toBeNull();
    });

    it("renders member list when isLoading is false", () => {
      const member = makeMember();
      renderMemberList([member], false);

      expect(screen.getByTestId("role-indicator")).toBeDefined();
    });

    it("renders the correct member count in the header", () => {
      const members = [
        makeMember({
          userId: "u1",
          user: { id: "u1", username: "alice", avatar: null } as any,
        }),
        makeMember({
          userId: "u2",
          user: { id: "u2", username: "bob", avatar: null } as any,
        }),
      ];
      renderMemberList(members, false);

      expect(screen.getByText(/2\s+total/i)).toBeDefined();
    });

    it("renders empty list when members array is empty and not loading", () => {
      renderMemberList([], false);

      expect(screen.queryByTestId("role-indicator")).toBeNull();
    });
  });

  // ── pagination ────────────────────────────────────────────────────────────

  describe("pagination", () => {
    it("renders the loading spinner when isFetchingNextPage is true", () => {
      render(
        <MemberList
          members={[makeMember()]}
          isLoading={false}
          pagination={{
            fetchNextPage: vi.fn(),
            hasNextPage: true,
            isFetchingNextPage: true,
          }}
        />,
      );

      expect(screen.getByTestId("loader")).toBeDefined();
    });

    it("does not render the loading spinner when isFetchingNextPage is false", () => {
      renderMemberList([makeMember()], false);
      expect(screen.queryByTestId("loader")).toBeNull();
    });
  });

  // ── role rendering ────────────────────────────────────────────────────────

  describe("role rendering", () => {
    it("renders 'Owner' label for OWNER role", () => {
      const member = makeMember({ role: "OWNER" });
      renderMemberItem(member);

      expect(screen.getByText("Owner")).toBeDefined();
    });

    it("renders 'Mod' label for MODERATOR role", () => {
      const member = makeMember({ role: "MODERATOR" });
      renderMemberItem(member);

      expect(screen.getByText("Mod")).toBeDefined();
    });

    it("renders 'Member' label for MEMBER role", () => {
      const member = makeMember({ role: "MEMBER" });
      renderMemberItem(member);

      expect(screen.getByText("Member")).toBeDefined();
    });
  });

  // ── muted indicator ───────────────────────────────────────────────────────

  describe("muted indicator", () => {
    it("renders VolumeX icon when member is muted", () => {
      const member = makeMember({ isMuted: true });
      const { container } = renderMemberItem(member);
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });

    it("does not render extra mute icon when member is not muted", () => {
      const member = makeMember({ isMuted: false });
      const { container } = renderMemberItem(member);
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(1);
    });
  });
});
