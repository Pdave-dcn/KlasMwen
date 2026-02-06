import { Skeleton } from "@/components/ui/skeleton";

export const LoadingState = () => {
  return (
    <div className="flex-1 p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={`items-${i + 1}`}
          className={`flex gap-2 ${i % 3 === 0 ? "flex-row-reverse" : "flex-row"}`}
        >
          {i % 3 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          <div
            className={`space-y-2 ${i % 3 === 0 ? "items-end" : "items-start"} flex flex-col`}
          >
            <Skeleton className="h-10 w-48 rounded-2xl" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
};
