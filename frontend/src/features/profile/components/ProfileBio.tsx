import { GraduationCap, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { mockUser } from "@/pages/profilePageMockData";
import type { User } from "@/types/auth.type";

interface ProfileBioProps {
  user: User;
}

const ProfileBio = ({ user }: ProfileBioProps) => (
  <div className="mt-4">
    <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-2">
      <div className="flex items-center gap-1">
        <GraduationCap className="w-4 h-4" />
        <span className="text-sm">{mockUser.major}</span>
      </div>
      <div className="flex items-center gap-1">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{mockUser.university}</span>
      </div>
      {/* <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">Joined January 2024</span>
      </div> */}
    </div>
    <Badge variant="secondary" className="mb-3 capitalize">
      {user?.role}
    </Badge>
    {user?.bio && <p className="text-sm text-foreground">{user?.bio}</p>}
  </div>
);

export default ProfileBio;
