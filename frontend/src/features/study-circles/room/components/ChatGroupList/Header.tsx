import { Search } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  return (
    <div className="p-3 border-b border-border">
      {/* <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Study Circles
      </h2> */}

      {/* Search */}
      <div className="mt-3 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search circles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-muted rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
};
