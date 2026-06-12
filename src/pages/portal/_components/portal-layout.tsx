import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  LogOut,
  Menu,
  X,
  Crown,
  Users,
  BarChart3,
  Download,
  Share,
  Heart,
  Trophy,
  Banknote,
  Megaphone,
  ShoppingBag,
  CreditCard,
  Shield,
  Eye,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { usePwaInstall } from "@/hooks/use-pwa-install.ts";
import { useState, useCallback } from "react";
import AvatarMenu from "./avatar-menu.tsx";
import NotificationBell from "./notification-bell.tsx";
import ChatPanel from "./chat-panel.tsx";
import OnboardingScreen from "./onboarding-screen.tsx";
import DarkModeToggle from "./dark-mode-toggle.tsx";
import { ViewModeProvider } from "@/hooks/use-view-mode.tsx";
import { useViewMode } from "@/hooks/view-mode-context.ts";
import { Switch } from "@/components/ui/switch.tsx";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";

const BASE_NAV_ITEMS = [
  { to: "/portal", icon: LayoutDashboard, label: "Dashboard", end: true, permission: "dashboard", exportKey: "dashboard" },
  { to: "/portal/campaigns", icon: List, label: "Campaigns", end: true, permission: "campaigns", exportKey: "campaigns" },
  { to: "/portal/campaigns/new", icon: PlusCircle, label: "New Campaign", end: false, permission: "new_campaign", exportKey: null },
  { to: "/portal/staff", icon: Users, label: "Staff", end: false, permission: "staff", exportKey: "staff" },
  { to: "/portal/prestige", icon: Crown, label: "Prestige", end: true, permission: "prestige", exportKey: "prestige" },
  { to: "/portal/quota", icon: Crown, label: "My Prestige", end: true, permission: "my_prestige", exportKey: null },
  { to: "/portal/donors", icon: Heart, label: "Donors", end: true, permission: "donors", exportKey: "donors" },
  { to: "/portal/leaderboard", icon: Trophy, label: "Leaderboard", end: true, permission: "leaderboard", exportKey: "leaderboard" },
  { to: "/portal/analytics", icon: BarChart3, label: "Analytics", end: false, permission: "analytics", exportKey: "analytics" },
  { to: "/portal/finance", icon: Banknote, label: "Finance", adminLabel: "Payroll", end: true, permission: "finance", exportKey: "finance" },
  { to: "/portal/meta-assets", icon: Megaphone, label: "Meta Assets", end: true, permission: "meta_assets", exportKey: "meta_assets" },
  { to: "/portal/shopify-import", icon: ShoppingBag, label: "Shopify Sync", end: true, permission: "meta_assets", exportKey: "shopify" },
  { to: "/portal/processors", icon: CreditCard, label: "Processors", end: true, permission: "processors", exportKey: "processors" },
] as const;

function PortalSidebar({ onClose }: { onClose?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useUserRole();
  const { canInstall, isInstalled, isIos, install } = usePwaInstall();
  const convex = useConvex();
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const handleExport = useCallback(async (sectionKey: string, label: string) => {
    setExportingKey(sectionKey);
    try {
      const data = await convex.query(api.export.exportSection.exportSection, { section: sectionKey });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hopebuilt-export-${sectionKey}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${label} exported successfully`);
    } catch {
      toast.error("Export failed. Admin access required.");
    } finally {
      setExportingKey(null);
    }
  }, [convex]);

  const navItems = BASE_NAV_ITEMS.filter(
    (item) => {
      // Hide "My Prestige" from admins — they use the admin Prestige page
      if (isAdmin && item.permission === "my_prestige") return false;
      return hasPermission(item.permission);
    },
  );

  // Show a small badge on the Campaigns nav item for admins when there are
  // wizard submissions awaiting approval.
  const pendingApprovalCount = useQuery(
    api.campaigns.pendingApprovalCount,
    isAdmin ? {} : "skip",
  ) ?? 0;

  return (
    <div className="flex flex-col h-full bg-[#1B4332] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <img
          src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
          alt="HopeBuilt"
          className="h-8 brightness-0 invert"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.to} className="flex items-center group">
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">
                {"adminLabel" in item && isAdmin ? item.adminLabel : item.label}
              </span>
              {item.to === "/portal/campaigns" && pendingApprovalCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#fff597] text-[#1B4332] text-[10px] font-bold">
                  {pendingApprovalCount}
                </span>
              )}
            </NavLink>
            {isAdmin && item.exportKey && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(item.exportKey as string, item.label);
                }}
                disabled={exportingKey === item.exportKey}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer shrink-0 ml-1",
                  exportingKey === item.exportKey
                    ? "text-white/50 animate-pulse"
                    : "text-white/30 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10",
                )}
                title={`Export ${item.label}`}
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* Install app prompt */}
      {!isInstalled && (canInstall || isIos) && (
        <div className="px-3 pb-2">
          {canInstall ? (
            <button
              onClick={() => install()}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5 shrink-0" />
              Install App
            </button>
          ) : isIos ? (
            <div className="rounded-lg bg-white/10 px-3 py-3 text-xs text-white/80 space-y-1">
              <div className="flex items-center gap-2 font-medium text-white text-sm">
                <Share className="w-4 h-4 shrink-0" />
                Install App
              </div>
              <p>
                Tap the <span className="font-semibold">Share</span> button in Safari, then{" "}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function PortalAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, hasPortalAccess } = useUserRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!hasPortalAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
        <img
          src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
          alt="HopeBuilt"
          className="h-12 mb-6 dark:brightness-0 dark:invert"
        />
        <h1 className="text-xl font-bold text-foreground mb-2">Access Restricted</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
          Your account does not have access to the Employee Portal. Please sign in with an authorized staff or admin account.
        </p>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="px-4 py-2.5 bg-[#1B4332] text-white rounded-lg text-sm font-medium hover:bg-[#143728] transition-colors cursor-pointer"
        >
          Sign Out &amp; Switch Account
        </button>
      </div>
    );
  }

  // Show onboarding overlay for new staff who haven't completed setup
  const showOnboarding = user && user.onboardingComplete === false;

  return (
    <>
      {children}
      {showOnboarding && <OnboardingScreen />}
    </>
  );
}

function ViewModeToggle() {
  const { isStaffView, toggleViewMode } = useViewMode();
  const { isActualAdmin } = useUserRole();

  if (!isActualAdmin) return null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary border border-border">
      <Shield className={cn("w-3.5 h-3.5 transition-colors", !isStaffView ? "text-[#1B4332]" : "text-muted-foreground")} />
      <span className={cn("text-xs font-medium transition-colors hidden sm:inline", !isStaffView ? "text-foreground" : "text-muted-foreground")}>
        Admin
      </span>
      <Switch
        checked={isStaffView}
        onCheckedChange={toggleViewMode}
        className="cursor-pointer data-[state=checked]:bg-[#1B4332]"
      />
      <Eye className={cn("w-3.5 h-3.5 transition-colors", isStaffView ? "text-[#1B4332]" : "text-muted-foreground")} />
      <span className={cn("text-xs font-medium transition-colors hidden sm:inline", isStaffView ? "text-foreground" : "text-muted-foreground")}>
        Staff
      </span>
    </div>
  );
}

function PortalInner() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isStaffView } = useViewMode();

  return (
    <div className="flex h-screen overflow-hidden bg-secondary">
      {/* Staff view banner */}
      {isStaffView && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-amber-950 text-center text-xs font-semibold py-1">
          Viewing as Staff
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn("hidden md:flex md:w-64 flex-col shrink-0", isStaffView && "mt-6")}>
        <PortalSidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className={cn("relative w-64 h-full", isStaffView && "mt-6")}>
            <PortalSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn("flex-1 flex flex-col overflow-hidden", isStaffView && "mt-6")}>
        {/* Top header bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 hover:bg-accent rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <img
              src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
              alt="HopeBuilt"
              className="h-7 md:hidden dark:brightness-0 dark:invert"
            />
            <ViewModeToggle />
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <ChatPanel />
            <NotificationBell />
            <AvatarMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function PortalLayout() {
  return (
    <Authenticated>
      <PortalAccessGuard>
        <ViewModeProvider>
          <PortalInner />
        </ViewModeProvider>
      </PortalAccessGuard>
    </Authenticated>
  );
}

export function PortalUnauthenticated() {
  return (
    <Unauthenticated>
      <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
        <img
          src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
          alt="HopeBuilt"
          className="h-12 mb-6 dark:brightness-0 dark:invert"
        />
        <h1 className="text-xl font-bold text-foreground mb-2">Employee Portal</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Sign in to access the HopeBuilt Portal.
        </p>
        <SignInButton
          onClick={() => {
            sessionStorage.setItem("auth_return_path", "/portal");
          }}
        />
      </div>
    </Unauthenticated>
  );
}

export function PortalAuthLoading() {
  return (
    <AuthLoading>
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </AuthLoading>
  );
}
