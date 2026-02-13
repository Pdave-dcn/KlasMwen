import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  characterCount?: {
    current: number;
    max: number;
  };
  children: React.ReactNode;
}

export function FormField({
  label,
  required,
  optional,
  error,
  characterCount,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
        {required && " *"}
        {optional && (
          <span className="text-muted-foreground font-normal"> (optional)</span>
        )}
      </label>
      {children}
      <div className="flex justify-between items-center min-h-5">
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
        {characterCount && (
          <span
            className={cn(
              "text-xs tabular-nums ml-auto",
              characterCount.current >= characterCount.max
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {characterCount.current}/{characterCount.max}
          </span>
        )}
      </div>
    </div>
  );
}
