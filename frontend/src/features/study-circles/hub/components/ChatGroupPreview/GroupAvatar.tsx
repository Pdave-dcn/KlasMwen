import { cn } from "@/lib/utils";
import { getGroupInitials } from "@/utils/getInitials.util";

export function GroupAvatar({
  name,
  avatar,
  size = "lg",
}: {
  name: string;
  avatar?: string;
  size?: "lg" | "sm";
}) {
  const sizeClass =
    size === "lg"
      ? "h-20 w-20 text-2xl rounded-2xl"
      : "h-10 w-10 text-sm rounded-xl";

  if (avatar) {
    return (
      <img src={avatar} alt={name} className={cn("object-cover", sizeClass)} />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-linear-to-br from-primary to-primary/60 font-bold text-primary-foreground shadow-sm",
        sizeClass,
      )}
    >
      {getGroupInitials(name)}
    </div>
  );
}
