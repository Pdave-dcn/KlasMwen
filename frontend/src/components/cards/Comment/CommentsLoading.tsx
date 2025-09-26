import { MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const CommentsLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center space-x-2">
        <MessageCircle className="w-5 h-5" />
        <div className="w-24 h-5 bg-muted rounded animate-pulse" />
      </CardTitle>
    </CardHeader>
    <CardContent className="flex items-center justify-center space-y-10">
      <Spinner />
    </CardContent>
  </Card>
);

export default CommentsLoading;
