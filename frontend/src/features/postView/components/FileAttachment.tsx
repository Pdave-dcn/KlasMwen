import { FileText, Download, CheckCircle2, Loader2, Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDownloadResourceWithProgressMutation } from "@/queries/post.query";
import type { LessExtendedPost } from "@/zodSchemas/post.zod";

interface FileAttachmentProps {
  post: LessExtendedPost;
}

const FileAttachment = ({ post }: FileAttachmentProps) => {
  const downloadMutation = useDownloadResourceWithProgressMutation();
  const download = downloadMutation.mutate;
  const { progress } = downloadMutation;

  const isComplete = progress === 100 && !downloadMutation.isPending;

  return (
    <div className="space-y-3">
      {post.isMock && (
        <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          <AlertDescription className="text-blue-800 dark:text-blue-300 ml-2 text-sm">
            <span className="font-semibold">Demo File:</span> This is a mock
            attachment for demonstration purposes. To test the download
            functionality, please create your own post with a file attachment.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-muted-foreground/20 hover:border-muted-foreground/30 transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="font-medium text-sm truncate"
                  title={post.fileName ?? ""}
                >
                  {post.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {progress > 0
                    ? "Downloading..."
                    : `Ready to download (${(
                        Number(post.fileSize) /
                        1024 /
                        1024
                      ).toFixed(2)} MB)`}
                </p>
              </div>
            </div>

            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              onClick={() =>
                download({ postId: post.id, fileName: post.fileName ?? "" })
              }
              disabled={downloadMutation.isPending || post.isMock}
              className="shrink-0 min-w-[110px] transition-all duration-200"
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete
                </>
              ) : progress > 0 ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {Number.isFinite(progress)
                    ? `${progress}%`
                    : "Downloading..."}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>

          {progress > 0 && (
            <div className="mt-3">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileAttachment;
