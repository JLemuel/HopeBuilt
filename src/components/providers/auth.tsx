import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ConvexReactClient,
  useAction,
  useConvexAuth,
  useQuery,
} from "convex/react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api.js";
import { AuthContext, type AuthContextValue } from "./auth-context.ts";
import { humanizeAuthError } from "@/lib/humanize-auth-error.ts";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL ?? "http://localhost:3000",
);

function AuthShim({ children }: { children: ReactNode }) {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensurePasswordAccount = useAction(api.auth.ensurePasswordAccount);
  const userRecord = useQuery(api.users.getCurrentUser);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const passwordLogin = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setActionLoading(true);
      try {
        await signIn("password", { email, password, flow: "signIn" });
      } catch (err) {
        const message = humanizeAuthError(err, "signIn");
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [signIn],
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      setError(null);
      setActionLoading(true);
      try {
        await signIn("password", {
          email,
          password,
          flow: "signUp",
          ...(name ? { name } : {}),
        });
      } catch (err) {
        const message = humanizeAuthError(err, "signUp");
        setError(message);
        throw new Error(message);
      } finally {
        setActionLoading(false);
      }
    },
    [signIn],
  );

  const socialLogin = useCallback(
    async (provider: "google") => {
      setError(null);
      try {
        await signIn(provider, { redirectTo: "/login" });
      } catch (err) {
        const message = humanizeAuthError(err, "oauth");
        setError(message);
        throw new Error(message);
      }
    },
    [signIn],
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      setError(null);
      try {
        // Users who signed up with Google have no password credential yet, so
        // the stock reset flow would throw `InvalidAccountId`. Create one for
        // them (no-op for everyone else) before requesting the OTP.
        await ensurePasswordAccount({ email });
        await signIn("password", { email, flow: "reset" });
      } catch (err) {
        const message = humanizeAuthError(err, "resetRequest");
        setError(message);
        throw new Error(message);
      }
    },
    [signIn, ensurePasswordAccount],
  );

  const verifyPasswordReset = useCallback(
    async (email: string, code: string, newPassword: string) => {
      setError(null);
      try {
        await signIn("password", {
          email,
          code,
          newPassword,
          flow: "reset-verification",
        });
      } catch (err) {
        const message = humanizeAuthError(err, "resetVerify");
        setError(message);
        throw new Error(message);
      }
    },
    [signIn],
  );

  const logout = useCallback(async () => {
    setError(null);
    await signOut();
  }, [signOut]);

  const user = useMemo(() => {
    if (!userRecord) return null;
    return {
      _id: userRecord._id,
      email: userRecord.email,
      name: userRecord.name,
    };
  }, [userRecord]);

  const value: AuthContextValue = {
    isLoading: isLoading || actionLoading,
    isAuthenticated,
    user,
    error,
    passwordLogin,
    signup,
    socialLogin,
    requestPasswordReset,
    verifyPasswordReset,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      <AuthShim>{children}</AuthShim>
    </ConvexAuthProvider>
  );
}
