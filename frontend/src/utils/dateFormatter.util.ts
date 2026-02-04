const formatMemberSince = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);
  return `Member since ${formattedDate}`;
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
  });
};

export const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) return date.toLocaleDateString();

  const MINUTE = 60;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY;

  if (diffInSeconds < MINUTE) return "just now";
  if (diffInSeconds < HOUR) return `${Math.floor(diffInSeconds / MINUTE)}m`;
  if (diffInSeconds < DAY) return `${Math.floor(diffInSeconds / HOUR)}h`;
  if (diffInSeconds < MONTH) return `${Math.floor(diffInSeconds / DAY)}d`;

  return date.toLocaleDateString();
};

export const formatTimeRemaining = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default formatMemberSince;
