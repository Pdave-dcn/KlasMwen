import type { Report } from "@/zodSchemas/report.zod";

export const ReportReason = ({ report }: { report: Report }) => (
  <div>
    <h3 className="font-semibold mb-2">Report Reason</h3>
    <div className="space-y-2">
      <div>
        <span className="inline-block">
          <span className="sr-only">Reason:</span>
        </span>
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <span className="inline-block">
              <span className="text-sm px-2 py-1 border rounded">
                {report.reason.label}
              </span>
            </span>
          </div>
        </div>
      </div>
      {report.reason.description && (
        <p className="text-sm text-muted-foreground">
          {report.reason.description}
        </p>
      )}
    </div>
  </div>
);
