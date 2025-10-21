import axios, { type AxiosError } from "axios";
import { toast } from "sonner";

import { handleRateLimitError } from "@/utils/rateLimitErrorHandler";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Global Response Interceptor
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 429) {
      const context = getRequestContext(error);
      handleRateLimitError(error, context);
      return Promise.reject(error);
    }

    // handle general network/server issues
    if (!error.response) {
      toast.error("Network Error", {
        description:
          "Unable to connect. Please check your internet and try again.",
      });
    } else if (status && status >= 500) {
      toast.error("Server Error", {
        description: "Something went wrong on our end. Please try again later.",
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Automatically derive context (used by handleRateLimitError)
 * from the request URL and method.
 */
function getRequestContext(error: AxiosError): string {
  const url = error.config?.url ?? "";
  const method = (error.config?.method ?? "").toLowerCase();

  if (url.includes("/posts") && method === "post") return "post.create";
  if (url.includes("/comments") && method === "post") return "comment.create";
  if (url.includes("/comments") && method === "delete") return "comment.delete";
  if (url.includes("/posts") && method === "put") return "post.update";
  if (url.includes("/posts") && method === "delete") return "post.delete";
  return "default";
}

export default api;
