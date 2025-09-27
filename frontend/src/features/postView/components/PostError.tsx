import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PostError = ({ onRetry }: { error: Error; onRetry: () => void }) => (
  <div className="max-w-4xl mx-auto p-6">
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to Load Post</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm mt-1">
                We couldn't load this post. Please try again.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4 flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
);

export default PostError;
