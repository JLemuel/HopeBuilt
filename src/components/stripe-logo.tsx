/**
 * Official Stripe "S" logo mark rendered as an inline SVG.
 * Accepts className for sizing via Tailwind (defaults to w-6 h-6).
 */
export default function StripeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Stripe"
    >
      <rect width="40" height="40" rx="8" fill="#635BFF" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.354 15.394c0-1.09.894-1.51 2.374-1.51 2.124 0 4.806.644 6.93 1.792V9.718c-2.32-.92-4.612-1.282-6.93-1.282-5.666 0-9.434 2.96-9.434 7.906 0 7.714 10.626 6.484 10.626 9.814 0 1.288-1.12 1.706-2.684 1.706-2.318 0-5.286-.952-7.636-2.24v5.992c2.6 1.118 5.228 1.596 7.636 1.596 5.806 0 9.798-2.87 9.798-7.892-.028-8.326-10.68-6.848-10.68-9.924Z"
        fill="white"
      />
    </svg>
  );
}
