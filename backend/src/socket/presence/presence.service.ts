const userSockets = new Map<string, Set<string>>();

export const PresenceService = {
  userConnected(userId: string, socketId: string) {
    const sockets = userSockets.get(userId) ?? new Set();
    sockets.add(socketId);
    userSockets.set(userId, sockets);

    return sockets.size === 1; // first connection
  },

  userDisconnected(userId: string, socketId: string) {
    const sockets = userSockets.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
      return true; // fully offline
    }

    return false;
  },

  /**
   * Filters a list of user IDs and returns only those currently online
   */
  getOnlineUsersFromList(userIds: string[]): string[] {
    return userIds.filter((id) => userSockets.has(id));
  },

  isOnline(userId: string) {
    return userSockets.has(userId);
  },
};
