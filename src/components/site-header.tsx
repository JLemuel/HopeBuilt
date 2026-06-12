import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import SiteHeaderAvatarMenu from "@/components/site-header-avatar-menu.tsx";

// Convex Auth persists its access + refresh tokens under keys prefixed with
// these constants (the suffix is a per-deployment namespace).
const CONVEX_AUTH_TOKEN_KEY_PREFIX = "__convexAuthJWT";

function useHasStoredAuthToken(): boolean {
  // Synchronous initializer so first paint already reflects reality — no
  // post-mount flicker between placeholder and the resolved state.
  const [hasToken] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(CONVEX_AUTH_TOKEN_KEY_PREFIX)) return true;
      }
    } catch {
      // localStorage can throw in private-mode / sandboxed contexts — treat
      // those as "no token" so we render the safe (logged-out) UI.
    }
    return false;
  });
  return hasToken;
}

export type SiteHeaderVariant = "hero-green" | "solid-dark" | "transparent";

interface SiteHeaderProps {
  variant?: SiteHeaderVariant;
  className?: string;
}

const NAV_LINKS = [
  { label: "Campaigns", href: "/campaigns" },
  { label: "About Us", href: "/about" },
  { label: "Campaign Guide", href: "/campaign-guide" },
  { label: "Help", href: "/help" },
  { label: "Contact", href: "/contact" },
];

const MOBILE_LINKS = [
  {
    label: "Browse Campaigns",
    description: "Discover fundraisers to support",
    href: "/campaigns",
  },
  {
    label: "Start a Campaign",
    description: "Launch your own story",
    href: "/start-campaign",
  },
  {
    label: "About Us",
    description: "Our mission, story, and impact",
    href: "/about",
  },
  {
    label: "Campaign Guide",
    description: "Tips for running a great campaign",
    href: "/campaign-guide",
  },
  {
    label: "Help Center",
    description: "FAQs and support",
    href: "/help",
  },
  {
    label: "Contact",
    description: "Get in touch with our team",
    href: "/contact",
  },
];

const variantClasses: Record<SiteHeaderVariant, string> = {
  "hero-green": "relative z-30 bg-transparent",
  "solid-dark": "relative z-30 bg-[#3d8d7a]",
  transparent: "absolute top-0 left-0 right-0 z-30 bg-transparent",
};

export default function SiteHeader({
  variant = "solid-dark",
  className,
}: SiteHeaderProps) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  // Suppress the auth-loading placeholder when localStorage has no Convex
  // session token — the session check is guaranteed to resolve to
  // unauthenticated, so we can skip the placeholder and render the
  // logged-out CTAs immediately. Returning visitors with a token still get
  // the placeholder until the server confirms.
  const probablySignedIn = useHasStoredAuthToken();
  const showAuthPlaceholder = authLoading && probablySignedIn;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className={cn(variantClasses[variant], className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="cursor-pointer shrink-0">
          <img
            src="https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai"
            alt="HopeBuilt"
            className={cn(
              "w-auto",
              variant === "hero-green" ? "h-10 sm:h-12" : "h-8 sm:h-10",
            )}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 flex-1 justify-end">
          {NAV_LINKS.map((link) =>
            link.href.startsWith("#") || link.href.includes("/#") ? (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/75 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.href}
                end
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive ? "text-white" : "text-white/75 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>

        {/* Right side (desktop) */}
        <div className="hidden md:flex items-center gap-3 shrink-0 min-h-9">
          {showAuthPlaceholder ? (
            <div className="w-9 h-9 rounded-full bg-white/15 animate-pulse" />
          ) : isAuthenticated ? (
            <SiteHeaderAvatarMenu tone="light" />
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/75 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                to="/start-campaign"
                className="inline-flex items-center gap-1.5 bg-[#fff597] hover:bg-[#ddd47d] text-[#2d6b5e] font-semibold text-sm px-4 py-2 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                Launch a Story
              </Link>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="md:hidden flex items-center gap-2 min-h-9">
          {showAuthPlaceholder ? (
            <div className="w-9 h-9 rounded-full bg-white/15 animate-pulse" />
          ) : isAuthenticated ? (
            <SiteHeaderAvatarMenu tone="light" />
          ) : null}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex items-center justify-center text-white cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile slide-in */}
      <div
        aria-hidden="true"
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setMobileOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        aria-hidden={!mobileOpen}
        className={cn(
          "md:hidden fixed top-0 right-0 z-50 h-full w-[85%] max-w-[400px] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="cursor-pointer"
          >
            <img
              src="https://hercules-cdn.com/file_csC9Rpxc7FkA4y5jvBL1n3gp"
              alt="HopeBuilt"
              className="h-7"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <div className="flex flex-col px-6 pt-2 flex-1 overflow-y-auto">
          {MOBILE_LINKS.map((link) => {
            const inner = (
              <div className="flex items-center justify-between py-5 border-b border-gray-100">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {link.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {link.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
              </div>
            );
            return link.href.startsWith("/#") ? (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer"
              >
                {inner}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer"
              >
                {inner}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 px-6 py-6 border-t border-gray-100">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-center rounded-full transition-colors cursor-pointer"
              >
                My Dashboard
              </Link>
              <Link
                to="/start-campaign"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold text-center rounded-full border border-gray-300 transition-colors cursor-pointer"
              >
                Start a Campaign
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/start-campaign"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-center rounded-full transition-colors cursor-pointer"
              >
                Start a Campaign
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-900 font-semibold text-center rounded-full border border-gray-300 transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
