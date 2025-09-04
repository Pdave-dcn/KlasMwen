import { useState } from "react";

import { TrendingUp, BookOpen } from "lucide-react";

import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { TagFilter } from "@/components/TagFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Post } from "@/zodSchemas/post.zod";

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Understanding React Hooks - Complete Guide",
    content:
      "Just finished my comprehensive notes on React Hooks! Including useState, useEffect, and custom hooks with practical examples. Perfect for anyone preparing for frontend interviews or learning React.",
    type: "NOTE",
    fileUrl: null,
    fileName: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: {
      id: "1",
      username: "sarahchen",
      avatar: {
        id: 1,
        url: "/api/placeholder/40/40",
      },
    },
    tags: [
      { id: 1, name: "JavaScript" },
      { id: 2, name: "React" },
    ],
    _count: {
      likes: 42,
      comments: 8,
    },
  },
  {
    id: "2",
    title: "Help with Quantum Mechanics Problem",
    content:
      "Struggling with this quantum tunneling problem from my advanced physics course. Has anyone worked through similar problems? Would appreciate any insights or study resources!",
    type: "QUESTION",
    fileUrl: null,
    fileName: null,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    author: {
      id: "2",
      username: "marcusj",
      avatar: {
        id: 2,
        url: "/api/placeholder/40/40",
      },
    },
    tags: [
      { id: 3, name: "Quantum Mechanics" },
      { id: 4, name: "Physics" },
    ],
    _count: {
      likes: 15,
      comments: 12,
    },
  },
  {
    id: "3",
    title: "Calculus Study Group Resources",
    content:
      "Sharing my collection of calculus practice problems and solutions. These helped me ace my midterm! Includes derivatives, integrals, and optimization problems with step-by-step solutions.",
    type: "RESOURCE",
    fileUrl: "https://example.com/files/calculus-resources.pdf",
    fileName: "calculus-practice-problems.pdf",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    author: {
      id: "3",
      username: "emma_math",
      avatar: {
        id: 3,
        url: "/api/placeholder/40/40",
      },
    },
    tags: [
      { id: 5, name: "Calculus" },
      { id: 6, name: "Mathematics" },
    ],
    _count: {
      likes: 67,
      comments: 23,
    },
  },
  {
    id: "4",
    title: "Organic Chemistry Lab Report Template",
    content: null,
    type: "RESOURCE",
    fileUrl: "https://example.com/files/lab-report-template.docx",
    fileName: "organic-chem-lab-template.docx",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    author: {
      id: "4",
      username: "chemstudent",
      avatar: {
        id: 4,
        url: "/api/placeholder/40/40",
      },
    },
    tags: [
      { id: 7, name: "Chemistry" },
      { id: 8, name: "Lab Report" },
    ],
    _count: {
      likes: 28,
      comments: 5,
    },
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
