import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report } from "@/zodSchemas/report.zod";

export const ContentInfo = ({
  report,
  isHidden,
}: {
  report: Report;
  isHidden: boolean;
}) => {
  const navigate = useNavigate();
  return (
    <div>
      <h3 className="font-semibold mb-2">Reported Content</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{report.contentType}</Badge>
          <Badge variant="outline">
            ID: {report.comment?.id ?? report.post?.id}
          </Badge>
          {isHidden && (
            <Badge className="bg-destructive text-destructive-foreground">
              Content Hidden
            </Badge>
          )}
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm whitespace-pre-wrap">
            {report.contentType === "post"
              ? report.post?.title
              : report.comment?.content}
          </p>
        </div>
        {report.contentType === "post" && report.post && (
          <Button
            variant="link"
            className="-mt-1"
            onClick={() =>
              navigate(
                `/@${report.post?.author.username}/post/${report.post?.id}`
              )
            }
          >
            Go to post
          </Button>
        )}
      </div>
    </div>
  );
};
