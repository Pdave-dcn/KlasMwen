import type { ChatGroup } from "./chat";
import type { RecentGroup } from "../components/RecentActivity/RecentGroupCard";
import type { SuggestedGroup } from "../components/SuggestedGroup/SuggestedGroupCard";

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock recent groups
const mockRecentGroups: RecentGroup[] = [
  {
    id: "recent-1",
    name: "Calculus Study Group",
    lastMessage: {
      senderName: "Jean",
      content: "Can someone explain integration by parts?",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    },
    activeMembers: 8,
  },
  {
    id: "recent-2",
    name: "CS Interview Prep",
    lastMessage: {
      senderName: "Alex",
      content: "Just solved the two-sum problem!",
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 min ago
    },
    activeMembers: 12,
  },
  {
    id: "recent-3",
    name: "Physics 101",
    lastMessage: {
      senderName: "Maria",
      content: "The exam is next week, lets review",
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    },
    activeMembers: 3,
  },
  {
    id: "recent-4",
    name: "Essay Writing Club",
    lastMessage: {
      senderName: "Sam",
      content: "Anyone want to peer review my draft?",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    activeMembers: 0,
  },
];

// Mock suggested groups
const mockSuggestedGroups: SuggestedGroup[] = [
  {
    id: "suggested-1",
    name: "AP Chemistry Study Circle",
    description: "Ace your AP Chemistry exam together",
    tags: ["Chemistry", "AP", "Grade11"],
    memberCount: 89,
    activeMembers: 15,
    isTrending: true,
  },
  {
    id: "suggested-2",
    name: "SAT Math Prep",
    description: "Daily practice problems and tips",
    tags: ["SAT", "Math", "TestPrep"],
    memberCount: 234,
    activeMembers: 42,
    isTrending: true,
  },
  {
    id: "suggested-3",
    name: "Spanish Conversation",
    description: "Practice speaking with native speakers",
    tags: ["Spanish", "Languages", "Speaking"],
    memberCount: 67,
    activeMembers: 8,
    isTrending: false,
  },
  {
    id: "suggested-4",
    name: "History Buffs",
    description: "Discuss world history and current events",
    tags: ["History", "Discussion", "Grade10"],
    memberCount: 45,
    activeMembers: 3,
    isTrending: false,
  },
];

// Mock public groups for discovery
const mockPublicGroups: (ChatGroup & {
  description: string;
  isPublic: boolean;
  activeMembers?: number;
})[] = [
  {
    id: "public-1",
    name: "Calculus Study Circle",
    description: "Help each other with derivatives, integrals, and more!",
    memberCount: 45,
    unreadCount: 0,
    isPublic: true,
    activeMembers: 12,
  },
  {
    id: "public-2",
    name: "CS Interview Prep",
    description: "Practice coding problems and mock interviews together.",
    memberCount: 128,
    unreadCount: 0,
    isPublic: true,
    activeMembers: 28,
  },
  {
    id: "public-3",
    name: "Biology 101 Help",
    description: "From cells to ecosystems - we cover it all.",
    memberCount: 32,
    unreadCount: 0,
    isPublic: true,
    activeMembers: 5,
  },
  {
    id: "public-4",
    name: "Language Exchange",
    description: "Practice languages with native speakers.",
    memberCount: 89,
    unreadCount: 0,
    isPublic: true,
    activeMembers: 18,
  },
  {
    id: "public-5",
    name: "Essay Writing Workshop",
    description: "Get feedback on your essays and improve your writing.",
    memberCount: 56,
    unreadCount: 0,
    isPublic: true,
    activeMembers: 7,
  },
  {
    id: "public-6",
    name: "Physics Problem Solvers",
    description: "Tackle challenging physics problems as a team.",
    memberCount: 41,
    unreadCount: 0,
    isPublic: true,
    activeMembers: 9,
  },
];

export interface PublicGroup extends ChatGroup {
  description: string;
  isPublic: boolean;
  activeMembers?: number;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface CreateGroupResponse {
  group: ChatGroup;
  success: boolean;
}

export interface JoinGroupResponse {
  success: boolean;
  group: ChatGroup;
}

// Placeholder API functions for Chat Hub
export const chatHubApi = {
  /**
   * Fetch recent groups the user has interacted with
   */
  fetchRecentGroups: async (): Promise<RecentGroup[]> => {
    await delay(400);
    return mockRecentGroups;
  },

  /**
   * Fetch suggested groups for the user
   */
  fetchSuggestedGroups: async (): Promise<SuggestedGroup[]> => {
    await delay(500);
    return mockSuggestedGroups;
  },

  /**
   * Fetch quick stats for the dashboard
   */
  fetchQuickStats: async (): Promise<{
    activeGroups: number;
    unreadMessages: number;
    studyPartners: number;
  }> => {
    await delay(200);
    return {
      activeGroups: 5,
      unreadMessages: 25,
      studyPartners: 12,
    };
  },

  /**
   * Fetch public groups available for discovery
   * @param searchQuery Optional search filter
   */
  fetchPublicGroups: async (searchQuery?: string): Promise<PublicGroup[]> => {
    await delay(600);

    let groups = [...mockPublicGroups];

    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      groups = groups.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ??
          g.description.toLowerCase().includes(query),
      );
    }

    return groups;
  },

  /**
   * Join a public group
   * @param groupId The ID of the group to join
   */
  joinGroup: async (groupId: string): Promise<JoinGroupResponse> => {
    await delay(400);

    const group = mockPublicGroups.find((g) => g.id === groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    // Return the group with updated member count
    return {
      success: true,
      group: {
        ...group,
        memberCount: group.memberCount + 1,
      },
    };
  },

  /**
   * Create a new chat group
   * @param payload Group creation data
   */
  createGroup: async (
    payload: CreateGroupPayload,
  ): Promise<CreateGroupResponse> => {
    await delay(500);

    const newGroup: ChatGroup = {
      id: `group-${Date.now()}`,
      name: payload.name,
      memberCount: 1,
      unreadCount: 0,
    };

    return {
      success: true,
      group: newGroup,
    };
  },

  /**
   * Leave a group
   * @param groupId The ID of the group to leave
   */
  leaveGroup: async (_groupId: string): Promise<{ success: boolean }> => {
    await delay(300);
    return { success: true };
  },
};
