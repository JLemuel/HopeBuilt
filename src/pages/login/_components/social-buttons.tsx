import { useState } from "react";
import { useAuth } from "@/hooks/use-auth.ts";

export default function SocialButtons() {
  const { socialLogin } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleGoogle() {
    if (pending) return;
    setPending(true);
    try {
      await socialLogin("google");
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={pending}
        className="w-full h-13 flex items-center justify-center gap-3 text-base font-medium bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-xl cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <GoogleLogo />
        {pending ? "Redirecting..." : "Continue with Google"}
      </button>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.68 9c0-.593.102-1.17.284-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
