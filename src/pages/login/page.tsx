import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import LoginForm from "./_components/login-form.tsx";
import SignupForm from "./_components/signup-form.tsx";
import SocialButtons from "./_components/social-buttons.tsx";
import ForgotPasswordForm from "./_components/forgot-password-form.tsx";
import SeoHead from "@/components/seo-head.tsx";

const ORG_BASELINE_RAISED = 1564811.36;
const ORG_BASELINE_DONORS = 61879;
const ORG_BASELINE_CAMPAIGNS = 150;

function LoginStats() {
  const stats = useQuery(api.publicCampaigns.getPublicStats);

  const raisedTotal = (stats?.totalRaised ?? 0) + ORG_BASELINE_RAISED;
  const donorTotal = (stats?.totalDonors ?? 0) + ORG_BASELINE_DONORS;

  const items = [
    { value: `${(donorTotal / 1000).toFixed(0)}K+`, label: "Donors" },
    { value: `$${(raisedTotal / 1_000_000).toFixed(1)}M+`, label: "Raised" },
    { value: `${ORG_BASELINE_CAMPAIGNS}+`, label: "Campaigns" },
  ];

  return (
    <div className="flex items-center gap-8">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-2xl font-bold text-[#fff597]">{item.value}</p>
          <p className="text-sm text-white/60 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip",
  );
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    // Wait for the user record before deciding where to send them
    if (currentUser === undefined) return;
    const target =
      currentUser?.role === "admin" || currentUser?.role === "employee"
        ? "/portal"
        : "/dashboard";
    navigate(target, { replace: true });
  }, [isAuthenticated, isLoading, currentUser, navigate]);

  const heading =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Reset your password";

  const subheading =
    mode === "signin"
      ? "Sign in to continue your giving journey"
      : mode === "signup"
        ? "Join thousands of donors making an impact"
        : "We'll email you a link to reset it";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <SeoHead title="Sign in" noindex />
      {/* ── Left panel (desktop only — on mobile we want the form in the
              first viewport, not a brand panel above the fold) ── */}
      <div className="relative hidden lg:flex lg:w-[48%] bg-[#3d8d7a] flex-col px-10 py-10 lg:px-14 lg:py-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(255,255,255,0.07),transparent)]" />

        <Link to="/" className="relative z-10 shrink-0">
          <img
            src="https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai"
            alt="HopeBuilt"
            className="h-12"
          />
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-12 lg:py-0">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Impact<br />Through Giving
          </h1>
          <p className="text-white/60 text-base lg:text-lg max-w-sm leading-relaxed mb-10">
            Join thousands of changemakers building a better world, one
            donation at a time.
          </p>

          <LoginStats />
        </div>

        <div className="relative z-10 mt-auto pt-10 lg:pt-0">
          <blockquote className="text-white/50 text-sm italic leading-relaxed max-w-sm">
            &ldquo;HopeBuilt made it effortless to support causes I care
            about. The transparency is unmatched.&rdquo;
          </blockquote>
          <p className="text-white/40 text-sm font-semibold mt-2">
            — Sarah M., Monthly Donor
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-10 sm:px-8 sm:py-12 lg:px-16">
        {/* Mobile-only HopeBuilt logo so the form area still has brand. */}
        <Link to="/" className="lg:hidden mb-8 self-center">
          <img
            src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
            alt="HopeBuilt"
            className="h-9"
          />
        </Link>
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{heading}</h2>
          <p className="text-gray-500 mb-10">{subheading}</p>

          {mode === "signin" && (
            <>
              <LoginForm onForgotPassword={() => setMode("forgot")} />

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <SocialButtons />

              <p className="text-center text-sm text-gray-400 mt-8">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#2d6b5e] font-semibold cursor-pointer hover:underline"
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === "signup" && (
            <>
              <SignupForm />

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <SocialButtons />

              <p className="text-center text-sm text-gray-400 mt-8">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-[#2d6b5e] font-semibold cursor-pointer hover:underline"
                >
                  Sign in
                </button>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <ForgotPasswordForm onBack={() => setMode("signin")} />
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing you agree to our{" "}
            <Link
              to="/terms"
              className="underline hover:text-gray-600 cursor-pointer"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="underline hover:text-gray-600 cursor-pointer"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
