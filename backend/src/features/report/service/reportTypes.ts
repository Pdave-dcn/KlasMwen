import type { UpdateStatusData } from "../../../zodSchemas/report.zod.js";
import type { Prisma, ReportStatus } from "@prisma/client";

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
        description: true,
      },
    },
    post: {
      select: {
        id: true,
        title: true,
        hidden: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
    comment: {
      select: {
        id: true,
        content: true,
        hidden: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
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

type Report = Prisma.ReportGetPayload<{
  select: typeof BaseSelectors.report;
}>;

type ReportContentType = "post" | "comment";

type EnrichedReportWithHiddenState = Report & {
  isContentHidden: boolean;
};

type EnrichedReportWithContentTypeField = Report & {
  contentType: ReportContentType;
};

type EnrichedReport = Report &
  EnrichedReportWithHiddenState &
  EnrichedReportWithContentTypeField;

interface ReportFilters {
  status?: ReportStatus;
  reasonId?: number;
  postId?: string;
  commentId?: number;
  dateFrom?: string;
  dateTo?: string;
  resourceType?: "post" | "comment";
}

export {
  BaseSelectors,
  type CreateReportData,
  type UpdateStatusData,
  type Report,
  type ReportContentType,
  type EnrichedReportWithHiddenState,
  type EnrichedReportWithContentTypeField,
  type EnrichedReport,
  type ReportFilters,
};
