import { Search } from "lucide-react";

const InitialState = () => (
  <div className="text-center py-12">
    <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
    <h3 className="mt-4 text-lg font-semibold">Start Searching</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Enter keywords or select tags to find posts
    </p>
  </div>
);

export default InitialState;
