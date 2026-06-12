import { createContext } from "react";

export type AuthUser = {
  email?: string;
  name?: string;
  _id?: string;
};

export type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  passwordLogin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  socialLogin: (provider: "google") => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordReset: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
