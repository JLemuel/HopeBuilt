import { useEffect, useState } from "react";
import { Mail, MessageSquare, ShieldAlert, Send, Check } from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/site-header.tsx";
import SeoHead from "@/components/seo-head.tsx";
import Footer from "@/components/footer.tsx";

const SUPPORT_EMAIL = "support@hopebuilt.org";

const CHANNELS = [
  {
    icon: Mail,
    title: "General support",
    description: "Account, donations, receipts, billing.",
    email: SUPPORT_EMAIL,
  },
  {
    icon: ShieldAlert,
    title: "Trust & safety",
    description: "Report a fraudulent campaign or policy violation.",
    email: "trust@hopebuilt.org",
    cta: { label: "Report an issue", to: "/report-issue" },
  },
  {
    icon: MessageSquare,
    title: "Press & partnerships",
    description: "Media inquiries, partnership proposals.",
    email: "press@hopebuilt.org",
  },
];

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = [
      `Name: ${name || "(not provided)"}`,
      `From: ${email || "(not provided)"}`,
      "",
      message,
    ].join("\n");
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject || "HopeBuilt support request",
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    setOpened(true);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SeoHead
        title="Contact us"
        description="Get in touch with the HopeBuilt team. Most messages get a response within one business day."
        canonicalPath="/contact"
      />
      <SiteHeader variant="solid-dark" />

      <section className="bg-[#3d8d7a] text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
          <span className="inline-block text-[#fff597] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            Contact
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
            Get in touch
          </h1>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-2xl">
            Have a question, a concern, or just want to say hi? Drop us a line
            and we&apos;ll get back to you within one business day.
          </p>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
          {/* Form */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mb-2">
              Send us a message
            </h2>
            <p className="text-[14px] text-black/55 mb-6">
              We&apos;ll open your email client with your message prefilled. If
              that doesn&apos;t work, email{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[#2d6b5e] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-[12px] font-semibold text-black/60 mb-1.5"
                  >
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-white border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/15 transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-[12px] font-semibold text-black/60 mb-1.5"
                  >
                    Reply-to email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/15 transition"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-[12px] font-semibold text-black/60 mb-1.5"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full bg-white border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/15 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-[12px] font-semibold text-black/60 mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's going on…"
                  className="w-full bg-white border border-black/15 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3d8d7a] focus:ring-2 focus:ring-[#3d8d7a]/15 transition resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send message
                </button>
                {opened ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-[#2d6b5e]">
                    <Check className="w-3.5 h-3.5" />
                    Email client opened — check the draft.
                  </span>
                ) : null}
              </div>
            </form>
          </div>

          {/* Channels */}
          <aside className="space-y-4">
            <h2 className="text-[10px] font-bold text-black/30 uppercase tracking-[0.18em]">
              Other ways to reach us
            </h2>
            {CHANNELS.map((c) => (
              <div
                key={c.title}
                className="border border-black/10 rounded-xl p-5"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-[#3d8d7a]/10 text-[#2d6b5e] flex items-center justify-center shrink-0">
                    <c.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#121212]">
                      {c.title}
                    </h3>
                    <p className="text-[12px] text-black/55 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${c.email}`}
                  className="block text-[13px] text-[#2d6b5e] hover:underline"
                >
                  {c.email}
                </a>
                {c.cta ? (
                  <Link
                    to={c.cta.to}
                    className="inline-block mt-2 text-[12px] text-[#2d6b5e] font-semibold hover:underline"
                  >
                    {c.cta.label} →
                  </Link>
                ) : null}
              </div>
            ))}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
