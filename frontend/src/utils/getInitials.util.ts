export const getInitials = (username: string) => {
  return username.substring(0, 2).toUpperCase();
};
