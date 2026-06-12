import { createContext, useContext, type ReactNode } from "react";
import { mockUser } from "./data.ts";

type MockAuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: typeof mockUser;
  login: () => void;
  logout: () => void;
};

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const value: MockAuthContextValue = {
    isAuthenticated: true,
    isLoading: false,
    user: mockUser,
    login: () => undefined,
    logout: () => undefined,
  };

  return (
    <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);

  if (!context) {
    throw new Error("useMockAuth must be used inside MockAuthProvider");
  }

  return context;
}
