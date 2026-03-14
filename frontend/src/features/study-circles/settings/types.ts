export type SettingsTab = "general" | "members" | "moderation" | "danger";

export interface MuteDuration {
  label: string;
  value: number | "indefinite";
}

export const MUTE_DURATIONS: MuteDuration[] = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "24 hours", value: 1440 },
  { label: "Indefinite", value: "indefinite" },
];
