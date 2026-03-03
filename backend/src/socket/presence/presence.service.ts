const connectedUsers = new Map<string, Set<string>>();

export const PresenceService = {
  userConnected(userId: string, socketId: string) {
    const sockets = connectedUsers.get(userId) ?? new Set();
    sockets.add(socketId);
    connectedUsers.set(userId, sockets);

    return sockets.size === 1; // first connection
  },

  userDisconnected(userId: string, socketId: string) {
    const sockets = connectedUsers.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      connectedUsers.delete(userId);
      return true; // fully offline
    }

    return false;
  },

  /**
   * Filters a list of user IDs and returns only those currently online
   */
  getOnlineUsersFromList(userIds: string[]): string[] {
    return userIds.filter((id) => connectedUsers.has(id));
  },

  isOnline(userId: string) {
    return connectedUsers.has(userId);
  },
};
