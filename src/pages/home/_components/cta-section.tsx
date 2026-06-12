import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CtaSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-[#3d8d7a] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 text-center">
        <div>
          <h2 className="text-[1.9rem] sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-4 tracking-tight text-balance">
            Ready to Build Hope?
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-8 sm:mb-9">
            Join thousands of donors creating lasting change around the world.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-3">
          <Link
            to="/donate"
            className="flex items-center justify-center gap-2 bg-[#fff597] hover:bg-[#ddd47d] text-[#2d6b5e] font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Donate Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/start-campaign"
            className="flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:border-white/50 text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Start a Campaign
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
