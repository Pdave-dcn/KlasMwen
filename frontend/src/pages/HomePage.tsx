import { useState } from "react";

import { TrendingUp, BookOpen } from "lucide-react";

import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { TagFilter } from "@/components/TagFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: "student" | "admin";
  university?: string;
  major?: string;
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

const mockPosts: Post[] = [
  {
    id: "1",
    author: {
      id: "1",
      name: "Sarah Chen",
      email: "sarah@university.edu",
      role: "student",
      university: "MIT",
      major: "Computer Science",
      avatar: "/api/placeholder/40/40",
    },
    title: "Understanding React Hooks - Complete Guide",
    content:
      "Just finished my comprehensive notes on React Hooks! Including useState, useEffect, and custom hooks with practical examples. Perfect for anyone preparing for frontend interviews or learning React.",
    tags: [
      { id: "1", name: "JavaScript", color: "green", category: "programming" },
      { id: "2", name: "React", color: "blue", category: "programming" },
    ],
    likes: 42,
    likedByUser: false,
    bookmarkedByUser: true,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: "note",
  },
  {
    id: "2",
    author: {
      id: "2",
      name: "Marcus Johnson",
      email: "marcus@university.edu",
      role: "student",
      university: "Stanford",
      major: "Physics",
      avatar: "/api/placeholder/40/40",
    },
    title: "Help with Quantum Mechanics Problem",
    content:
      "Struggling with this quantum tunneling problem from my advanced physics course. Has anyone worked through similar problems? Would appreciate any insights or study resources!",
    tags: [
      {
        id: "3",
        name: "Quantum Mechanics",
        color: "purple",
        category: "physics",
      },
      { id: "4", name: "Physics", color: "purple", category: "physics" },
    ],
    likes: 15,
    likedByUser: true,
    bookmarkedByUser: false,
    commentsCount: 12,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    type: "question",
  },
  {
    id: "3",
    author: {
      id: "3",
      name: "Emma Rodriguez",
      email: "emma@university.edu",
      role: "student",
      university: "Harvard",
      major: "Mathematics",
      avatar: "/api/placeholder/40/40",
    },
    title: "Calculus Study Group Resources",
    content:
      "Sharing my collection of calculus practice problems and solutions. These helped me ace my midterm! Includes derivatives, integrals, and optimization problems with step-by-step solutions.",
    tags: [
      { id: "5", name: "Calculus", color: "blue", category: "math" },
      { id: "6", name: "Mathematics", color: "blue", category: "math" },
    ],
    likes: 67,
    likedByUser: false,
    bookmarkedByUser: false,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    type: "resource",
  },
];

const HomePage = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredPosts =
    selectedTags.length === 0
      ? mockPosts
      : mockPosts.filter((post) =>
          post.tags.some((tag) => selectedTags.includes(tag.name))
        );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Tag Filter */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Filter by Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TagFilter
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  onClearAll={() => setSelectedTags([])}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filter Info */}
            {selectedTags.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Showing {filteredPosts.length} posts for:</span>
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={(id) => console.log("Like post:", id)}
                  onBookmark={(id) => console.log("Bookmark post:", id)}
                  onComment={(id) => console.log("Comment on post:", id)}
                />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <Card className="card-elevated text-center py-12">
                <CardContent>
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or check back later for new
                    content.
                  </p>
                  <Button onClick={() => setSelectedTags([])}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
