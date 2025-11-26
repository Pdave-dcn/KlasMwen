import { MessageCircle } from "lucide-react";

import { CardHeader, CardTitle } from "@/components/ui/card";

interface CommentCardHeaderProps {
  totalComments: number;
}

const CommentCardHeader = ({ totalComments }: CommentCardHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle className="text-lg flex items-center space-x-2">
        <MessageCircle className="w-5 h-5" />
        <span>Comments ({totalComments ?? 0})</span>
      </CardTitle>
    </CardHeader>
  );
};

export default CommentCardHeader;
