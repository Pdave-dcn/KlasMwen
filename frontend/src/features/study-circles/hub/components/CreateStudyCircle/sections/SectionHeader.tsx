interface SectionHeaderProps {
  number: number;
  title: string;
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}
