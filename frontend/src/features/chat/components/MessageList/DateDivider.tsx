import { getDateLabel } from "./helpers";

export const DateDivider = ({ date }: { date: Date }) => {
  const label = getDateLabel(date);

  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};
