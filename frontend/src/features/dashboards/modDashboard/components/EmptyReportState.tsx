export const EmptyReportsState = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-12 text-center">
      <div className="text-muted-foreground">
        <p className="text-lg font-medium mb-2">No reports found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    </div>
  );
};
