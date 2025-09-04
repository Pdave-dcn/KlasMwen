interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: "student" | "admin";
  university?: string;
  major?: string;
  bio?: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  category:
    | "math"
    | "physics"
    | "programming"
    | "chemistry"
    | "biology"
    | "default";
}

interface Post {
  id: string;
  author: User;
  content: string;
  title?: string;
  tags: Tag[];
  likes: number;
  likedByUser: boolean;
  bookmarkedByUser: boolean;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  type: "note" | "question" | "resource";
}

const mockUser: User = {
  id: "1",
  name: "Alex Chen",
  email: "alex.chen@university.edu",
  avatar: "/api/placeholder/150/150",
  role: "student",
  university: "MIT",
  major: "Computer Science",
  bio: "Passionate about algorithms and machine learning. Always eager to help fellow students with coding challenges and share knowledge about computer science concepts.",
};

const mockUserPosts: Post[] = [
  {
    id: "1",
    author: mockUser,
    title: "Data Structures Cheat Sheet",
    content:
      "Just created a comprehensive cheat sheet for common data structures. Includes time complexities and use cases for arrays, linked lists, stacks, queues, trees, and graphs. Hope this helps with upcoming exams! 📚",
    tags: [
      {
        id: "1",
        name: "programming",
        color: "#10B981",
        category: "programming",
      },
      {
        id: "2",
        name: "data-structures",
        color: "#3B82F6",
        category: "programming",
      },
    ],
    likes: 42,
    likedByUser: true,
    bookmarkedByUser: false,
    commentsCount: 8,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    type: "resource",
  },
  {
    id: "2",
    author: mockUser,
    title: "Help with Calculus Integration",
    content:
      "Struggling with integration by parts. Can someone explain the LIATE rule with a clear example? My exam is next week and I'm still confused about when to use which technique.",
    tags: [
      { id: "3", name: "math", color: "#8B5CF6", category: "math" },
      { id: "4", name: "calculus", color: "#F59E0B", category: "math" },
    ],
    likes: 15,
    likedByUser: false,
    bookmarkedByUser: true,
    commentsCount: 12,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    type: "question",
  },
];

const userStats = {
  posts: 24,
  followers: 156,
  following: 89,
};

export { mockUser, mockUserPosts, userStats, type User, type Tag, type Post };
