import { useQuery } from "convex/react";
import { format } from "date-fns";
import { Flame } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";

type Profile = {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
} | null | undefined;

export default function ProfileHeader({
  profile,
  onEditProfile,
}: {
  profile: Profile;
  onEditProfile: () => void;
}) {
  const stats = useQuery(api.donorDashboard.getMyStats, {});
  const memberSinceQuery = useQuery(api.users.getCurrentUser, {});
  const initials = getInitials(profile?.name ?? profile?.email ?? "?");
  const memberSince = memberSinceQuery?._creationTime
    ? format(new Date(memberSinceQuery._creationTime), "MMMM yyyy")
    : "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
      {/* Avatar */}
      <Avatar className="w-14 h-14 shrink-0">
        {profile?.avatarUrl ? (
          <AvatarImage
            src={profile.avatarUrl}
            alt={profile.name || "Profile"}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-[#3d8d7a]/15 text-[#2d6b5e] font-bold text-lg uppercase">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-900">
          {profile?.name || "Loading..."}
        </h1>
        <p className="text-sm text-gray-500">{profile?.email}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Member since {memberSince}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:ml-auto shrink-0">
        {(stats?.givingStreak ?? 0) > 0 && (
          <Badge
            variant="outline"
            className="rounded-full border-[#3d8d7a]/30 bg-[#3d8d7a]/5 px-3 py-1.5 text-[#2d6b5e] [&>svg]:size-3.5"
          >
            <Flame />
            {stats?.givingStreak}-month giving streak
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onEditProfile}
          className="rounded-full bg-white text-black border-gray-300 px-4 font-medium shadow-none cursor-pointer"
        >
          Edit Profile
        </Button>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
