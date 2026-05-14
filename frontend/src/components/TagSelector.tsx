/* eslint-disable complexity */
import { useState, useRef, useEffect } from "react";

import { X, Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTagQuery } from "@/queries/tag.query";

const MAX_TAGS = 10;

interface TagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tags, isLoading, isError } = useTagQuery();

  // Get selected tag IDs as a Set for efficient lookup
  const selectedTagIdsSet = new Set(selectedTagIds);

  // Get selected tags for display
  const selectedTags =
    tags?.filter((tag) => selectedTagIdsSet.has(tag.id)) ?? [];

  // Filter tags based on query and exclude already selected ones
  const filteredTags =
    tags?.filter(
      (tag) =>
        !selectedTagIdsSet.has(tag.id) &&
        tag.name.toLowerCase().includes(query.toLowerCase()),
    ) ?? [];

  const addTag = (tagId: number) => {
    if (selectedTagIds.length >= MAX_TAGS) return;
    onChange([...selectedTagIds, tagId]);
    setQuery("");
    inputRef.current?.focus();
  };

  const removeTag = (tagId: number) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const atLimit = selectedTagIds.length >= MAX_TAGS;

  if (isLoading) {
    return (
      <div className="h-12 rounded-xl border border-input bg-muted/50 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      </div>
    );
  }

  if (isError || !tags) {
    return (
      <div className="h-12 rounded-xl border border-destructive bg-destructive/10 flex items-center justify-center">
        <p className="text-sm text-destructive">Failed to load tags</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Selected tags */}
      <AnimatePresence mode="popLayout">
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <motion.div
                key={tag.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  variant="secondary"
                  className="pl-2.5 pr-1 py-1 text-xs font-medium gap-1 cursor-default bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                >
                  #{tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={`Remove ${tag.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Search input */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-2 h-12 rounded-xl border bg-background px-3 transition-colors",
            isOpen ? "border-primary ring-2 ring-primary/20" : "border-input",
            atLimit && "opacity-60",
          )}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={atLimit ? "Maximum tags reached" : "Search topics..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={atLimit}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {selectedTagIds.length}/{MAX_TAGS}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && !atLimit && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg"
            >
              {filteredTags.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  {query ? "No matching topics" : "No topics available"}
                </div>
              ) : (
                <ScrollArea className="h-48">
                  <div className="p-1">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addTag(tag.id)}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent/50 transition-colors focus:outline-none focus:bg-accent/50"
                      >
                        <span className="text-muted-foreground mr-1">#</span>
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
