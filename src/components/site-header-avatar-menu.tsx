import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { LayoutDashboard, LogOut, ShieldCheck, User } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { useAuth } from "@/hooks/use-auth.ts";
import { useUserRole } from "@/hooks/use-user-role.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { cn } from "@/lib/utils.ts";

type Tone = "light" | "dark";

interface SiteHeaderAvatarMenuProps {
  /** "light" = white ring/text on dark bg; "dark" = colored ring on light bg. */
  tone?: Tone;
}

export default function SiteHeaderAvatarMenu({ tone = "light" }: SiteHeaderAvatarMenuProps) {
  const profile = useQuery(api.profile.getMyProfile);
  const { hasPortalAccess } = useUserRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (profile === undefined || profile === null) {
    return (
      <div
        className={cn(
          "w-9 h-9 rounded-full animate-pulse",
          tone === "light" ? "bg-white/15" : "bg-black/10",
        )}
      />
    );
  }

  const initials = (profile.name || profile.email || "?")
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded-full overflow-hidden ring-offset-2 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3d8d7a] cursor-pointer",
          tone === "light"
            ? "ring-1 ring-white/30 hover:ring-white/60 ring-offset-transparent"
            : "ring-1 ring-black/10 hover:ring-[#3d8d7a]/50 ring-offset-white",
        )}
        aria-label="Open account menu"
      >
        <div className="w-9 h-9 rounded-full bg-[#3d8d7a] text-white text-sm font-bold flex items-center justify-center overflow-hidden">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name || "Account"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 pb-2">
          <span className="text-sm font-semibold truncate">
            {profile.name || "Welcome"}
          </span>
          <span className="text-xs text-muted-foreground truncate font-normal">
            {profile.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {hasPortalAccess && (
          <DropdownMenuItem onSelect={() => navigate("/portal")}>
            <ShieldCheck className="w-4 h-4" />
            Portal
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onSelect={() => navigate("/dashboard")}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </DropdownMenuItem>

        {!hasPortalAccess && (
          <DropdownMenuItem
            onSelect={() => navigate("/dashboard?edit=1")}
          >
            <User className="w-4 h-4" />
            Profile
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
