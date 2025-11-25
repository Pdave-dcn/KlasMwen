import prisma from "../../core/config/db.js";
import { createLogger } from "../../core/config/logger.js";
import { calculateMetrics, handleSeedingError } from "../utils/seedHelpers.js";

import type { Prisma } from "@prisma/client";

const logger = createLogger({ module: "ReportReasonSeeder" });

/**
 * Predefined report reasons that users can select when reporting content
 */
const REPORT_REASONS: Prisma.ReportReasonCreateInput[] = [
  {
    label: "Spam",
    description:
      "Unsolicited promotional content, repetitive messages, or irrelevant advertisements that clutter the platform",
    active: true,
  },
  {
    label: "Harassment",
    description:
      "Abuse, intimidation, or malicious behavior targeting an individual or group. This includes sustained bullying, threats, doxxing, and hate speech intended to degrade or humiliate",
    active: true,
  },
  {
    label: "Hate Speech",
    description:
      "Content that attacks or demeans individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics",
    active: true,
  },
  {
    label: "Misinformation",
    description:
      "False or misleading information presented as fact, especially regarding academic content, health, safety, or current events",
    active: true,
  },
  {
    label: "Inappropriate Content",
    description:
      "Content that violates community standards including explicit material, graphic violence, or other content unsuitable for an educational platform",
    active: true,
  },
  {
    label: "Off-Topic",
    description:
      "Content that is unrelated to the course, academic discussion, or platform purpose",
    active: true,
  },
  {
    label: "Plagiarism",
    description:
      "Content that presents someone else's work, ideas, or resources as one's own without proper attribution",
    active: true,
  },
  {
    label: "Personal Information",
    description:
      "Sharing of private or sensitive information without consent, including contact details, addresses, or identifying information",
    active: true,
  },
  {
    label: "Copyright Violation",
    description:
      "Unauthorized use or distribution of copyrighted material without permission or proper licensing",
    active: true,
  },
  {
    label: "Other",
    description:
      "Report reason not covered by the predefined categories. Please provide additional context in your report",
    active: true,
  },
];

const seedReportReasons = async () => {
  try {
    logger.info("Report reason creation phase started");
    const reasonCreationStartTime = Date.now();

    const createdReasons = await prisma.reportReason.createManyAndReturn({
      data: REPORT_REASONS,
    });

    const metrics = calculateMetrics(
      reasonCreationStartTime,
      createdReasons.length
    );

    const reasonStats = {
      totalReasonsCreated: createdReasons.length,
      totalActiveReasons: createdReasons.filter((r) => r.active).length,
      reasonCreationDuration: metrics.duration,
      skipped: false,
    };

    logger.info(reasonStats, "Report reason creation phase completed");

    return {
      reasons: createdReasons,
      reasonStats,
    };
  } catch (error) {
    return handleSeedingError(
      error,
      logger,
      "Report reason creation",
      "report_reasons",
      {}
    );
  }
};

export default seedReportReasons;
