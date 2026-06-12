import { ArrowRight } from "lucide-react";

const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1616518921461-433d264be347?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGNoaWxkcmVuJTIwcGxheWluZyUyMG91dGRvb3JzJTIwc3VubnklMjBncmFzcyUyMGZpZWxkJTIwY2hhcml0eSUyMGh1bWFuaXRhcmlhbnxlbnwwfHx8fDE3NzYwMzQ2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080";

export default function AboutSection() {
  return (
    <section id="about" className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden h-[260px] sm:h-[320px] lg:h-[460px]">
            <img
              src={ABOUT_IMAGE}
              alt="Community impact"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#3d8d7a]/10 pointer-events-none" />
          </div>

          {/* Text */}
          <div>
            <div>
              <span className="inline-block text-[#2d6b5e] text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-2 sm:mb-3">
                Who We Are
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#121212] leading-tight tracking-tight mb-4 sm:mb-6">
                Driven by Compassion,
                <br />
                Guided by Humanity
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-[15px] text-[#4B5563] leading-relaxed">
                With compassion at our core, we deliver essential aid to children
                and families facing hardship.
              </p>
              <p className="text-sm sm:text-[15px] text-[#4B5563] leading-relaxed">
                At our core, we believe giving is more than charity — it{"'"}s a
                shared promise of humanity. That{"'"}s why we go beyond
                short-term relief to deliver thoughtful, meaningful, and lasting
                impact.
              </p>

              <div className="w-8 sm:w-10 h-0.5 bg-[#3d8d7a] rounded-full" />

              <a
                href="#campaigns"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#2d6b5e] hover:text-[#2d6b5e] font-semibold transition-colors cursor-pointer pt-1"
              >
                Learn More About Us
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
