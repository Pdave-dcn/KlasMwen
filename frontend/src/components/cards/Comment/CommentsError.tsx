import { AlertCircle, MessageCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CommentsError = ({ onRetry }: { error: Error; onRetry: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center space-x-2">
        <MessageCircle className="w-5 h-5" />
        <span>Comments</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-medium">Failed to load comments</p>
            <p className="text-sm mt-1">
              Something went wrong. Please try again.
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
);

export default CommentsError;
