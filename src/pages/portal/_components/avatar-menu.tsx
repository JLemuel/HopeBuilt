import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuth } from "@/hooks/use-auth.ts";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export default function AvatarMenu() {
  const profile = useQuery(api.profile.getMyProfile);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (profile === undefined) return null;

  const initials = (profile.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0",
            profile.avatarUrl ? "" : "bg-[#1B4332] text-white",
          )}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:inline max-w-[120px] truncate">
          {profile.name || "Profile"}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-popover rounded-xl shadow-lg border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User info header */}
          <div className="px-3.5 py-2.5 border-b border-border">
            <p className="text-sm font-semibold text-popover-foreground truncate">{profile.name || "No name"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#1B4332]/10 text-[#1B4332] dark:bg-[#1B4332]/30 dark:text-emerald-300 capitalize">
              {profile.role}
            </span>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/portal/profile");
              }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              Profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
