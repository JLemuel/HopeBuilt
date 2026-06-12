import type { ReactNode } from "react";

export function ConvexAuthProvider({ children }: { children: ReactNode; client?: unknown }) {
  return <>{children}</>;
}

export function useAuthActions() {
  return {
    signIn: async (..._args: any[]) => undefined,
    signOut: async (..._args: any[]) => undefined,
  };
}
