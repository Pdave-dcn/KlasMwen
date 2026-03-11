import { type StudyCircleRole as MemberRole } from "@/zodSchemas/circle.zod";

export type SettingsTab = "general" | "members" | "moderation" | "danger";

export interface MuteDuration {
  label: string;
  value: number | null; // null = indefinite, number = minutes
}

export const MUTE_DURATIONS: MuteDuration[] = [
  { label: "15 minutes", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "24 hours", value: 1440 },
  { label: "Indefinite", value: null },
];

export interface SettingsMember {
  id: string;
  username: string;
  avatar?: string;
  role: MemberRole;
  isOnline: boolean;
  isMuted: boolean;
  mutedUntil?: string | null;
  joinedAt: string;
}

export interface CircleSettings {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isPublic: boolean;
  slowMode: boolean;
  slowModeInterval: number; // seconds
  createdAt: string;
}
