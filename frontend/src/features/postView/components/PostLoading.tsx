import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const PostLoading = () => (
  <Card>
    <CardHeader>
      <CardTitle />
    </CardHeader>
    <CardContent className="flex items-center justify-center space-y-10">
      <Spinner />
    </CardContent>
  </Card>
);

export default PostLoading;
