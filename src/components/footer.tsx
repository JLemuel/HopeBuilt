import { Link } from "react-router-dom";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from "@/components/social-icons.tsx";

const PLATFORM_LINKS = [
  { label: "Campaigns", href: "/campaigns" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", href: "/help" },
  { label: "FAQs", href: "/help#faqs" },
  { label: "Campaign Guidelines", href: "/campaign-guide" },
  { label: "Report an Issue", href: "/report-issue" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

const SOCIAL_LINKS: Array<{
  label: string;
  href: string | null;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
}> = [
  { label: "X", href: null, icon: TwitterIcon },
  { label: "Facebook", href: null, icon: FacebookIcon },
  { label: "Instagram", href: null, icon: InstagramIcon },
  { label: "LinkedIn", href: null, icon: LinkedinIcon },
];

function isInternal(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("/#");
}

function FooterLink({ href, children, className }: { href: string; children: React.ReactNode; className: string }) {
  if (isInternal(href)) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function SocialIcons({ size }: { size: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7" : "w-7 h-7";
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_LINKS.map((s) =>
        s.href ? (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`HopeBuilt on ${s.label}`}
            className={`${dim} rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer`}
          >
            <s.icon className="w-4 h-4" />
          </a>
        ) : (
          <span
            key={s.label}
            aria-hidden="true"
            className={`${dim} rounded-lg bg-none flex items-center justify-center text-white/40 select-none`}
          >
            <s.icon className="w-4 h-4" />
          </span>
        ),
      )}
    </div>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2d6b5e] text-white ">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 pt-12 sm:pt-14 pb-8 sm:pb-8">

        {/* Mobile: brand full-width, links in 3 cols */}
        <div className="mb-8 sm:mb-12">
          {/* Brand row */}
          <div className="mb-7 sm:mb-0 sm:hidden">
            <Link to="/" className="inline-block mb-3 cursor-pointer">
              <img src="https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai" alt="HopeBuilt" className="h-6" />
            </Link>
            <p className="text-[12px] text-black/40 leading-relaxed mb-4 max-w-[240px]">
              Empowering communities through transparent giving.
            </p>
            <SocialIcons size="sm" />
          </div>

          {/* Mobile link columns */}
          <div className="grid grid-cols-3 gap-4 sm:hidden">
            {[
              { title: "Platform", links: PLATFORM_LINKS },
              { title: "Support", links: SUPPORT_LINKS },
              { title: "Legal", links: LEGAL_LINKS },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[9px] font-bold text-white uppercase tracking-[0.15em] mb-3">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink
                        href={link.href}
                        className="text-[12px] text-white/50 hover:text-[#2d6b5e] transition-colors cursor-pointer leading-tight block"
                      >
                        {link.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Desktop: 4-col grid */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="inline-block mb-4 cursor-pointer">
                <img src="https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai" alt="HopeBuilt" className="h-7" />
              </Link>
              <p className="text-[13px] text-white/50 leading-relaxed mb-5 max-w-[200px]">
                Empowering communities through transparent giving.
              </p>
              <SocialIcons size="md" />
            </div>

            {[
              { title: "Platform", links: PLATFORM_LINKS },
              { title: "Support", links: SUPPORT_LINKS },
              { title: "Legal", links: LEGAL_LINKS },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.15em] mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink
                        href={link.href}
                        className="text-[13px] text-white/50 hover:text-[#2d6b5e] transition-colors cursor-pointer"
                      >
                        {link.label}
                      </FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-4 sm:mb-6" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-[11px] text-white/25">
          <p>&copy; {currentYear} Hope Built. All rights reserved.</p>
          <p>built with <span className="text-white/70">&#9829;</span> for a better world</p>
        </div>
      </div>
    </footer>
  );
}
