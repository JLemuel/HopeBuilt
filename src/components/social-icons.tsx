import type * as React from "react";

// lucide-react v1 dropped brand icons, so these glyphs are drawn inline in the
// same 24x24 stroke style.
function SocialIcon({ children, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function TwitterIcon(props: React.ComponentProps<"svg">) {
  return (
    <SocialIcon {...props}>
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </SocialIcon>
  );
}

export function FacebookIcon(props: React.ComponentProps<"svg">) {
  return (
    <SocialIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </SocialIcon>
  );
}

export function InstagramIcon(props: React.ComponentProps<"svg">) {
  return (
    <SocialIcon {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </SocialIcon>
  );
}

export function LinkedinIcon(props: React.ComponentProps<"svg">) {
  return (
    <SocialIcon {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v2" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </SocialIcon>
  );
}
