import { Link } from "react-router-dom";

import type { Report } from "@/zodSchemas/report.zod";

export const ReporterInfo = ({ report }: { report: Report }) => {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Reporter Information</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground block">Username:</span>
          <Link
            to={`/profile/${report.reporter.id}`}
            replace
            className="hover:underline inline-block"
          >
            <p className="font-medium">{report.reporter.username}</p>
          </Link>
        </div>
        <div>
          <span className="text-muted-foreground">Email:</span>
          <p className="font-medium">{report.reporter.email}</p>
        </div>
      </div>
    </div>
  );
};
