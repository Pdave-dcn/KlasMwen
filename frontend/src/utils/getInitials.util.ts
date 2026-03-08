export const getInitials = (username: string) => {
  return username.substring(0, 2).toUpperCase();
};

export const getCircleInitials = (groupName: string) => {
  return groupName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};
