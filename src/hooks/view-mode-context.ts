import { createContext, useContext } from "react";

export type ViewMode = "admin" | "staff";

export type ViewModeContextValue = {
  viewMode: ViewMode;
  isStaffView: boolean;
  toggleViewMode: () => void;
};

export const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "admin",
  isStaffView: false,
  toggleViewMode: () => {},
});

export function useViewMode() {
  return useContext(ViewModeContext);
}
