import type { UpdateStatusData } from "../../../zodSchemas/report.zod.js";
import type { Prisma } from "@prisma/client";

const ReportFragments = {
  userBase: {
    id: true,
    username: true,
    email: true,
    role: true,
  } satisfies Prisma.UserSelect,

  postBase: {
    id: true,
    title: true,
    type: true,
    author: {
      select: {
        id: true,
        username: true,
      },
    },
    createdAt: true,
  } satisfies Prisma.PostSelect,

  commentBase: {
    id: true,
    content: true,
    author: {
      select: {
        id: true,
        username: true,
      },
    },
    postId: true,
    createdAt: true,
  } satisfies Prisma.CommentSelect,

  reportReasonBase: {
    id: true,
    label: true,
    description: true,
  } satisfies Prisma.ReportReasonSelect,
} as const;

const BaseSelectors = {
  user: ReportFragments.userBase,

  post: ReportFragments.postBase,

  comment: ReportFragments.commentBase,

  reportReason: ReportFragments.reportReasonBase,

  // Full report info for admin or moderator views
  report: {
    id: true,
    status: true,
    moderatorNotes: true,
    createdAt: true,

    reporter: {
      select: ReportFragments.userBase,
    },
    reason: {
      select: {
        id: true,
        label: true,
      },
    },
    post: {
      select: {
        id: true,
        title: true,
      },
    },
    comment: {
      select: {
        id: true,
        content: true,
      },
    },
  } satisfies Prisma.ReportSelect,
} as const;

interface CreateReportData {
  reporterId: string;
  reasonId: number;
  postId?: string;
  commentId?: number;
}

export { BaseSelectors, type CreateReportData, type UpdateStatusData };
