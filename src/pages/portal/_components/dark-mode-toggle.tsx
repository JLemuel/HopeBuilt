import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export default function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center w-14 h-7 rounded-full p-0.5 transition-colors cursor-pointer",
        isDark ? "bg-white/15" : "bg-black/10",
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Track icons */}
      <Sun className={cn(
        "absolute left-1.5 w-3.5 h-3.5 transition-opacity",
        isDark ? "opacity-40 text-muted-foreground" : "opacity-0",
      )} />
      <Moon className={cn(
        "absolute right-1.5 w-3.5 h-3.5 transition-opacity",
        isDark ? "opacity-0" : "opacity-40 text-muted-foreground",
      )} />

      {/* Thumb */}
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full shadow-sm transition-transform duration-200",
          isDark
            ? "translate-x-7 bg-[#1B4332] text-white"
            : "translate-x-0 bg-white text-[#1B4332]",
        )}
      >
        {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}
