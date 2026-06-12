import { useContext } from "react";
import { AuthContext } from "@/components/providers/auth-context.ts";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useUser() {
  return useAuth().user;
}
