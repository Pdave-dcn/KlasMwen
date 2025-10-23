import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PostNotFound = () => (
  <main className="max-w-4xl mx-auto p-6">
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>Post Not Found</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>This post doesn't exist or has been removed.</p>
      </CardContent>
    </Card>
  </main>
);

export default PostNotFound;
