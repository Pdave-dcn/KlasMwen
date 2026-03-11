import type { SettingsMember, CircleSettings } from "./types";

export const mockCircleSettings: CircleSettings = {
  id: "group-1",
  name: "CS 101 Study Group",
  description:
    "A collaborative space for CS 101 students to discuss lectures, share notes, and prepare for exams together.",
  isPublic: true,
  slowMode: false,
  slowModeInterval: 5,
  createdAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
};

export const mockSettingsMembers: SettingsMember[] = [
  {
    id: "user-1",
    username: "You",
    isOnline: true,
    role: "OWNER",
    isMuted: false,
    joinedAt: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-2",
    username: "Sarah Chen",
    isOnline: true,
    role: "MODERATOR",
    isMuted: false,
    joinedAt: new Date(Date.now() - 45 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-3",
    username: "Alex Kim",
    isOnline: true,
    role: "MEMBER",
    isMuted: false,
    joinedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-4",
    username: "Jordan Taylor",
    isOnline: false,
    role: "MEMBER",
    isMuted: false,
    joinedAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-5",
    username: "Maya Patel",
    isOnline: true,
    role: "MEMBER",
    isMuted: true,
    mutedUntil: null,
    joinedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-6",
    username: "Chris Wong",
    isOnline: false,
    role: "MEMBER",
    isMuted: false,
    joinedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-7",
    username: "Lena Brooks",
    isOnline: true,
    role: "MEMBER",
    isMuted: true,
    mutedUntil: new Date(Date.now() + 60 * 60000).toISOString(),
    joinedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
  {
    id: "user-8",
    username: "Raj Gupta",
    isOnline: false,
    role: "MEMBER",
    isMuted: false,
    joinedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
  },
];
