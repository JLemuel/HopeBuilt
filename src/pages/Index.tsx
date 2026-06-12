import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { useUserRole } from "@/hooks/use-user-role.ts";
import HomePage from "./home/page.tsx";

export default function Index() {
  const { isAuthenticated } = useConvexAuth();
  const { hasPortalAccess, isLoading } = useUserRole();
  const navigate = useNavigate();

  // If an authenticated portal user lands here (e.g. after login callback),
  // redirect them straight to the portal
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    // Check for a saved return path first (set when signing in from portal)
    const returnPath = sessionStorage.getItem("auth_return_path");
    if (returnPath) {
      sessionStorage.removeItem("auth_return_path");
      navigate(returnPath, { replace: true });
      return;
    }

    if (hasPortalAccess) {
      navigate("/portal", { replace: true });
    }
  }, [isAuthenticated, isLoading, hasPortalAccess, navigate]);

  return <HomePage />;
}
