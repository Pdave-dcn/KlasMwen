import { Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/zodSchemas/circle.zod";

interface SearchSuggestionsDropdownProps {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  visible: boolean;
}

export function SearchSuggestionsDropdown({
  suggestions,
  isLoading,
  onSelect,
  visible,
}: SearchSuggestionsDropdownProps) {
  if (!visible) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
      {isLoading ? (
        <div className="p-3 text-sm text-muted-foreground text-center">
          Searching...
        </div>
      ) : (
        <ul className="py-1">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => onSelect(suggestion)}
                className={cn(
                  "w-full px-4 py-2.5 text-left flex items-center justify-between",
                  "hover:bg-accent transition-colors",
                  "focus:outline-none focus:bg-accent",
                )}
              >
                <span className="font-medium text-foreground truncate">
                  {suggestion.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                  <Users className="w-3 h-3" />
                  {suggestion.memberCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
