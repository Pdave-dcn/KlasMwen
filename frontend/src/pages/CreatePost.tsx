import { useState, useEffect } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { ArrowLeft, X, Upload, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PostType } from "@/zodSchemas/post.zod";

const CreatePost = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postType = searchParams.get("type") as PostType;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Redirect to home if no valid post type
  useEffect(() => {
    if (!postType || !["QUESTION", "NOTE", "RESOURCE"].includes(postType)) {
      void navigate("/home");
    }
  }, [postType, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      type: postType,
      title,
      content: postType !== "RESOURCE" ? content : undefined,
      tags,
      file: postType === "RESOURCE" ? file : undefined,
    };

    console.log("Post submitted:", formData);
    // Here you would typically send the data to your backend

    // Reset form and navigate back
    setTitle("");
    setContent("");
    setTags([]);
    setNewTag("");
    setFile(null);
    void navigate("/");
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const getFormTitle = () => {
    switch (postType) {
      case "QUESTION":
        return "Ask a Question";
      case "NOTE":
        return "Create a Note";
      case "RESOURCE":
        return "Share a Resource";
      default:
        return "Create Post";
    }
  };

  const getFormDescription = () => {
    switch (postType) {
      case "QUESTION":
        return "Share your question with the community and get helpful answers.";
      case "NOTE":
        return "Document your knowledge and insights to help others learn.";
      case "RESOURCE":
        return "Upload a file or document to share with the community.";
      default:
        return "";
    }
  };

  if (!postType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 px-0 hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="bg-card p-8 rounded-lg shadow-card border border-border">
              <h1 className="text-3xl font-bold mb-2">{getFormTitle()}</h1>
              <p className="text-muted-foreground">{getFormDescription()}</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card p-8 rounded-lg shadow-card border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter your ${postType?.toLowerCase()} title...`}
                  required
                  className="text-base"
                />
              </div>

              {/* Content Field (for QUESTION and NOTE only) */}
              {postType !== "RESOURCE" && (
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-base font-semibold">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Write your ${postType?.toLowerCase()} content here...`}
                    required
                    rows={12}
                    className="text-base resize-none"
                  />
                </div>
              )}

              {/* File Upload (for RESOURCE only) */}
              {postType === "RESOURCE" && (
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-base font-semibold">
                    File *
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <Label htmlFor="file" className="cursor-pointer">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      {file ? (
                        <div>
                          <p className="text-lg font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-medium mb-2">
                            Click to upload a file
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Or drag and drop your file here
                          </p>
                        </div>
                      )}
                    </Label>
                  </div>
                </div>
              )}

              {/* Tags Field */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary hover:shadow-elegant"
                  disabled={
                    !title ||
                    (postType !== "RESOURCE" && !content) ||
                    (postType === "RESOURCE" && !file)
                  }
                >
                  Publish {postType?.toLowerCase()}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
