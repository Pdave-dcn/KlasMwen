import prisma from "../../../core/config/db";

type ReportableResource = "post" | "comment";

interface AutoHideOptions {
  resourceType: ReportableResource;
  resourceId: string | number;
  threshold?: number;
  gracePeriodMs?: number;
}

/**
 * Automatically hides a post or comment if it receives enough reports within a grace period.
 *
 * This function checks if a resource (post or comment) has reached a report threshold and,
 * if so, verifies whether the grace period has elapsed since the threshold was reached.
 * If both conditions are met and the resource isn't already hidden, it will be hidden.
 *
 * @param {AutoHideOptions} options - Configuration options for auto-hiding content
 * @param {string} options.resourceType - Type of resource to check ("post" or "comment")
 * @param {string | number} options.resourceId - ID of the resource (string for posts, number for comments)
 * @param {number} [options.threshold=5] - Minimum number of non-dismissed reports required to trigger auto-hide
 * @param {number} [options.gracePeriodMs=86400000] - Time in milliseconds to wait after threshold is reached before hiding (default: 24 hours)
 * @return {Promise<void>} A promise that resolves when the check and potential hide operation completes
 */
export const autoHideContent = async ({
  resourceType,
  resourceId,
  threshold = 5,
  gracePeriodMs = 24 * 60 * 60 * 1000, // 24 hours
}: AutoHideOptions): Promise<void> => {
  const relationField = resourceType === "post" ? "postId" : "commentId";

  // Count total active reports
  const reportCount = await prisma.report.count({
    where: {
      [relationField]: resourceId,
      status: { not: "DISMISSED" },
    },
  });

  if (reportCount < threshold) return;

  // Get the report that reached the threshold
  const thresholdReport = await prisma.report.findMany({
    where: {
      [relationField]: resourceId,
      status: { not: "DISMISSED" },
    },
    orderBy: { createdAt: "asc" },
    take: threshold,
  });

  if (!thresholdReport.length) return;

  const thresholdReachedAt =
    thresholdReport[thresholdReport.length - 1].createdAt;
  const elapsed = Date.now() - thresholdReachedAt.getTime();

  // If grace period not yet passed, exit
  if (elapsed < gracePeriodMs) return;

  // Hide resource if not already hidden
  if (resourceType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: resourceId as string },
      select: { hidden: true },
    });

    if (!post?.hidden) {
      await prisma.post.update({
        where: { id: resourceId as string },
        data: { hidden: true },
      });
    }
  } else {
    const comment = await prisma.comment.findUnique({
      where: { id: resourceId as number },
      select: { hidden: true },
    });

    if (!comment?.hidden) {
      await prisma.comment.update({
        where: { id: resourceId as number },
        data: { hidden: true },
      });
    }
  }
};
