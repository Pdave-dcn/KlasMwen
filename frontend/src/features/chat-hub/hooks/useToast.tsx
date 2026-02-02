import { toast as sonnerToast } from "sonner";

// Simple wrapper around Sonner's toast function
export function toast({
  title,
  description,
  variant = "default",
  ...props
}: {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  switch (variant) {
    case "success":
      return sonnerToast.success(title ?? description, {
        description: title ? description : undefined,
        ...props,
      });
    case "error":
      return sonnerToast.error(title ?? description, {
        description: title ? description : undefined,
        ...props,
      });
    case "warning":
      return sonnerToast.warning(title ?? description, {
        description: title ? description : undefined,
        ...props,
      });
    case "info":
      return sonnerToast.info(title ?? description, {
        description: title ? description : undefined,
        ...props,
      });
    default:
      return sonnerToast(title ?? description, {
        description: title ? description : undefined,
        ...props,
      });
  }
}

// Hook that returns the toast function
export function useToast() {
  return {
    toast,
    success: (message: string, description?: string) =>
      sonnerToast.success(message, { description }),
    error: (message: string, description?: string) =>
      sonnerToast.error(message, { description }),
    warning: (message: string, description?: string) =>
      sonnerToast.warning(message, { description }),
    info: (message: string, description?: string) =>
      sonnerToast.info(message, { description }),
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    loading: (message: string) => sonnerToast.loading(message),
  };
}
