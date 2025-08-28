type Role = "STUDENT" | "ADMIN";

interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export type { Role, User };
