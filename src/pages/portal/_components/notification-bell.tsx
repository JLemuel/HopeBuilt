import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Megaphone,
  DollarSign,
  Crown,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { formatDistanceToNow } from "date-fns";

/** Icon mapping for notification types */
function NotificationIcon({ type }: { type: string }) {
  const base = "w-4 h-4 shrink-0";
  switch (type) {
    case "campaign_published":
      return <Megaphone className={cn(base, "text-blue-500")} />;
    case "donation_received":
      return <DollarSign className={cn(base, "text-emerald-500")} />;
    case "prestige_rankup":
      return <Crown className={cn(base, "text-amber-500")} />;
    case "commission_earned":
      return <DollarSign className={cn(base, "text-green-600")} />;
    case "wallet_changed":
      return <Wallet className={cn(base, "text-orange-500")} />;
    case "message_received":
      return <Megaphone className={cn(base, "text-purple-500")} />;
    default:
      return <Bell className={cn(base, "text-muted-foreground")} />;
  }
}

/** Get the navigation path for a notification based on its type */
function getNotificationPath(type: string, relatedId?: string): string | null {
  switch (type) {
    case "campaign_published":
      return relatedId ? `/portal/campaigns/${relatedId}` : "/portal/campaigns";
    case "donation_received":
      return relatedId ? `/portal/donors/${relatedId}` : "/portal/donors";
    case "prestige_rankup":
      return "/portal/quota";
    case "commission_earned":
      return "/portal/quota";
    case "wallet_changed":
      return "/portal/profile";
    case "message_received":
      return null; // Handled by opening the chat panel instead
    default:
      return null;
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const notifications = useQuery(api.notifications.list, { limit: 20 });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayCount = unreadCount ?? 0;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {displayCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {displayCount > 99 ? "99+" : displayCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-popover rounded-xl shadow-xl border border-border z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-popover-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {displayCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-[11px] font-medium text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-accent rounded cursor-pointer"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications === undefined ? (
              <div className="px-4 py-8 text-center">
                <div className="w-5 h-5 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => {
                    if (!notif.read) {
                      markRead({ notificationId: notif._id });
                    }
                    if (notif.type === "message_received") {
                      setOpen(false);
                      window.dispatchEvent(new CustomEvent("open-chat-panel"));
                      return;
                    }
                    const path = getNotificationPath(notif.type, notif.relatedId);
                    if (path) {
                      setOpen(false);
                      navigate(path);
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 w-full px-4 py-3 text-left transition-colors cursor-pointer border-b border-border/50 last:border-b-0",
                    notif.read
                      ? "bg-popover hover:bg-accent"
                      : "bg-[#1B4332]/5 dark:bg-[#1B4332]/20 hover:bg-[#1B4332]/10 dark:hover:bg-[#1B4332]/30",
                  )}
                >
                  {/* Icon */}
                  <div className="mt-0.5">
                    <NotificationIcon type={notif.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-snug truncate",
                        notif.read ? "text-popover-foreground font-medium" : "text-popover-foreground font-semibold",
                      )}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="mt-1.5 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-emerald-400" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer - mark all read */}
          {notifications && notifications.length > 0 && displayCount > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted">
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1.5 text-xs font-medium text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer mx-auto"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
