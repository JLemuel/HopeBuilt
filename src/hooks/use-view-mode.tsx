import { useCallback, useState } from "react";
import { ViewModeContext, type ViewMode } from "@/hooks/view-mode-context.ts";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("admin");

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "admin" ? "staff" : "admin"));
  }, []);

  return (
    <ViewModeContext.Provider
      value={{ viewMode, isStaffView: viewMode === "staff", toggleViewMode }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}
