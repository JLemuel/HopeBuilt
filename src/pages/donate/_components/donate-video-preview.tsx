import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type DonateVideoPreviewProps = {
  videoUrl: string;
  posterUrl?: string;
  title?: string;
};

export default function DonateVideoPreview({
  videoUrl,
  posterUrl,
  title,
}: DonateVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Respect reduced motion: don't autoplay if user prefers reduced motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Try to autoplay with sound. Browsers typically block this, so fall back
  // to muted playback and unmute automatically on the first user interaction.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    let hasUnmuted = false;
    let cancelled = false;

    const tryUnmutedPlay = async () => {
      try {
        video.muted = false;
        video.volume = 1;
        await video.play();
        if (!cancelled) {
          hasUnmuted = true;
          setIsMuted(false);
        }
      } catch {
        // Autoplay with audio was blocked — fall back to muted playback.
        video.muted = true;
        if (!cancelled) setIsMuted(true);
        try {
          await video.play();
        } catch {
          // Ignore — user can tap to play
        }
      }
    };

    void tryUnmutedPlay();

    // If autoplay was blocked, unmute on the user's first interaction
    // anywhere on the page.
    const handleFirstInteraction = () => {
      if (hasUnmuted) return;
      if (!video) return;
      video.muted = false;
      video.volume = 1;
      void video.play().then(() => {
        hasUnmuted = true;
        setIsMuted(false);
      }).catch(() => {
        // Leave muted — user can tap the video
      });
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "keydown",
      "scroll",
    ];
    events.forEach((e) =>
      window.addEventListener(e, handleFirstInteraction, {
        once: true,
        passive: true,
      }),
    );

    return () => {
      cancelled = true;
      events.forEach((e) =>
        window.removeEventListener(e, handleFirstInteraction),
      );
    };
  }, [prefersReducedMotion, videoUrl]);

  function handleToggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
    if (!next) {
      void video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        void video.play().catch(() => undefined);
      });
    }
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleToggleMute}
        aria-label={isMuted ? "Unmute campaign video" : "Mute campaign video"}
        className={cn(
          "relative block w-full overflow-hidden rounded-xl border border-[#cfcfcf] bg-black cursor-pointer group",
          "shadow-sm",
        )}
        style={{ aspectRatio: "16 / 9" }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          autoPlay={!prefersReducedMotion}
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Soft gradient overlay so payment controls remain the focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20 pointer-events-none" />

        {/* Title caption */}
        {title && (
          <div className="absolute bottom-2 left-3 right-12 pointer-events-none">
            <p className="text-white text-[13px] font-medium line-clamp-1 drop-shadow-sm">
              {title}
            </p>
          </div>
        )}

        {/* Mute/unmute indicator */}
        <div
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center",
            "group-hover:bg-black/75 transition-colors backdrop-blur-sm",
          )}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </div>
      </button>
      <p className="text-[11px] text-[#9e9e9e] text-center mt-1.5">
        Tap the video to {isMuted ? "unmute" : "mute"}
      </p>
    </div>
  );
}
