const STEPS = [
  {
    number: "01",
    title: "Choose a Campaign",
    description:
      "Browse our curated selection of verified campaigns supporting causes that matter most to you.",
    icon: CampaignIcon,
    accent: "#3d8d7a",
    bg: "#e8f5f1",
  },
  {
    number: "02",
    title: "Make a Donation",
    description:
      "Give once or set up recurring monthly donations — every dollar is tracked transparently.",
    icon: DonateIcon,
    accent: "#3d8d7a",
    bg: "#d9f0ea",
  },
  {
    number: "03",
    title: "See Your Impact",
    description:
      "Receive real-time updates and watch your contribution make a tangible difference.",
    icon: ImpactIcon,
    accent: "#3d8d7a",
    bg: "#c8e8df",
  },
] as const;

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative">
      {/* Dark curved top band with heading */}
      <div className="relative bg-[#3d8d7a] pt-16 sm:pt-20 lg:pt-24 pb-32 sm:pb-40 lg:pb-48 rounded-t-[3rem] sm:rounded-t-[4rem] lg:rounded-t-[5rem]">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Raising funds just got{" "}
              <span className="text-[#fff597]">waaaay</span> more easier
            </h2>
            <p className="mt-4 text-white/60 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Get access to millions of caring people around the world waiting
              to hear your story.
            </p>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-[1px] overflow-hidden">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-[50px] sm:h-[70px] lg:h-[100px] block"
          >
            <path
              d="M0 0C360 80 720 80 1080 40C1260 20 1380 0 1440 0V100H0V0Z"
              fill="#3d8d7a"
            />
          </svg>
        </div>
      </div>

      {/* Steps area — light background */}
      <div className="relative bg-[#F9FBF9] pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-24 lg:pb-32">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #3d8d7a 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
          {/* Steps grid */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 lg:gap-10">
            {/* Connector line (desktop only) */}
            <div className="hidden sm:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px">
              <div className="h-full bg-gradient-to-r from-[#3d8d7a] via-[#3d8d7a] to-[#3d8d7a]" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, transparent, transparent 8px, #fff 8px, #fff 12px)",
                }}
              />
            </div>

            {STEPS.map((step, i) => (
              <div key={step.title} className="group relative">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 h-full flex flex-row sm:flex-col items-start sm:items-center text-left sm:text-center shadow-sm hover:shadow-xl transition-shadow duration-500 border border-[#E5F0E8] gap-4 sm:gap-0">
                  <div
                    className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-6 shadow-md transition-transform duration-300 group-hover:scale-110"
                    style={{ background: step.bg }}
                  >
                    <step.icon />
                    <span
                      className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center shadow"
                      style={{ background: step.accent }}
                    >
                      {i + 1}
                    </span>
                  </div>

                  <div className="flex-1 sm:w-full">
                    <span
                      className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1 sm:mb-2 block"
                      style={{ color: step.accent }}
                    >
                      Step {step.number}
                    </span>
                    <h3 className="text-[15px] sm:text-lg font-bold text-[#121212] mb-1.5 sm:mb-3 leading-tight tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[#525252] text-[13px] sm:text-sm leading-relaxed">
                      {step.description}
                    </p>
                    <div
                      className="mt-4 sm:mt-6 h-1 rounded-full w-8 hidden sm:block"
                      style={{ background: step.accent }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12 sm:mt-16">
            <a
              href="#campaigns"
              className="inline-flex items-center gap-2 text-[#2d6b5e] font-semibold text-sm hover:gap-3 transition-all duration-200"
            >
              Browse campaigns and get started
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampaignIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-7 h-7 text-[#2d6b5e]"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7l6-4 6 4 6-4v13l-6 4-6-4-6 4V7z" />
      <path d="M9 3v13" />
      <path d="M15 7v13" />
    </svg>
  );
}

function DonateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-7 h-7 text-[#2d6b5e]"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <path d="M12 8v4M10 10h4" strokeWidth={1.5} />
    </svg>
  );
}

function ImpactIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-7 h-7 text-[#2d6b5e]"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
