import { useEffect, useRef, type RefObject } from "react";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /**
   * How much of the sentinel element must be visible before triggering.
   * 0.1 means 10% of the element is visible.
   * @default 0.1
   */
  threshold?: number;
  /**
   * Whether the infinite scroll is enabled.
   * Useful for disabling it conditionally without unmounting.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Observes a sentinel element and triggers paginated data fetching when it
 * enters the viewport, enabling infinite scroll without manual scroll listeners.
 *
 * Attach the returned ref to an empty `<div>` placed at the boundary where
 * loading should trigger — the bottom of a list for top-to-bottom scroll, or
 * the top for reversed layouts like chat threads. Fetching is debounced
 * naturally by the `isFetchingNextPage` guard, so `fetchNextPage` won't fire
 * again until the in-flight request settles.
 *
 * @param options.hasNextPage       - Whether more pages exist. When `false`,
 *                                    the observer will still run but will never
 *                                    call `fetchNextPage`.
 * @param options.isFetchingNextPage - Guards against duplicate fetches while
 *                                    a request is in-flight.
 * @param options.fetchNextPage     - Called once per intersection when both
 *                                    `hasNextPage` is `true` and
 *                                    `isFetchingNextPage` is `false`.
 * @param options.threshold         - Fraction of the sentinel that must be
 *                                    visible before triggering (0–1).
 *                                    @default 0.1
 * @param options.enabled           - Set to `false` to pause observation
 *                                    without unmounting the component.
 *                                    @default true
 *
 * @returns A ref to attach to the sentinel `<div>`.
 *
 * @example
 * // Standard list — sentinel sits below the last item
 * const sentinelRef = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });
 *
 * return (
 *   <ul>
 *     {items.map(item => <li key={item.id}>{item.name}</li>)}
 *     <div ref={sentinelRef} aria-hidden />
 *   </ul>
 * );
 *
 * @example
 * // Reversed chat thread — sentinel sits above the first message
 * const sentinelRef = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });
 *
 * return (
 *   <div>
 *     <div ref={sentinelRef} aria-hidden />
 *     {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *   </div>
 * );
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 0.1,
  enabled = true,
}: UseInfiniteScrollOptions): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold, enabled]);

  return sentinelRef;
}
