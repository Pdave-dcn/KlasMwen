import { format, isToday, isYesterday, isSameDay } from "date-fns";

import type { CircleMessage } from "@/zodSchemas/circle.zod";

export interface GroupedMessage {
  date: Date;
  messages: { message: CircleMessage; showSender: boolean }[];
}

/**
 * Formats a date into a human-readable label
 * @param date - The date to format
 * @returns "Today", "Yesterday", or a formatted date string
 */
export const getDateLabel = (date: Date): string => {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMMM d, yyyy");
  }
};

/**
 * Determines whether sender information should be displayed for a message
 * @param currentMessage - The current message
 * @param previousMessage - The previous message in the list
 * @returns true if sender info should be shown
 */
export const shouldShowSender = (
  currentMessage: CircleMessage,
  previousMessage: CircleMessage | undefined,
): boolean => {
  if (!previousMessage) {
    return true;
  }

  const currentDate = new Date(currentMessage.createdAt);
  const previousDate = new Date(previousMessage.createdAt);

  return (
    previousMessage.sender.id !== currentMessage.sender.id ||
    !isSameDay(previousDate, currentDate)
  );
};

/**
 * Groups messages by date and determines sender visibility
 * @param messages - Array of chat messages
 * @returns Array of grouped messages by date
 */
export const groupMessagesByDate = (
  messages: CircleMessage[],
): GroupedMessage[] => {
  const grouped: GroupedMessage[] = [];

  messages.forEach((message, index) => {
    const messageDate = new Date(message.createdAt);
    const prevMessage = messages[index - 1];
    const showSender = shouldShowSender(message, prevMessage);

    // Find existing group for this date
    const existingGroup = grouped.find((g) => isSameDay(g.date, messageDate));

    if (existingGroup) {
      existingGroup.messages.push({ message, showSender });
    } else {
      grouped.push({
        date: messageDate,
        messages: [{ message, showSender }],
      });
    }
  });

  return grouped;
};
