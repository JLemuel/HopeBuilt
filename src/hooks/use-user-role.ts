import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { DEFAULT_EMPLOYEE_PERMISSIONS } from "@/convex/permissions.ts";
import { useViewMode } from "@/hooks/view-mode-context.ts";

export function useUserRole() {
  const user = useQuery(api.users.getCurrentUser);
  const { isStaffView } = useViewMode();

  // When an admin toggles to "Staff View", treat them as an employee
  // so every isAdmin check in the portal shows the staff experience
  const actuallyAdmin = user?.role === "admin";
  const effectiveAdmin = actuallyAdmin && !isStaffView;

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (effectiveAdmin) return true;
    // In staff view, use default employee permissions
    if (actuallyAdmin && isStaffView) {
      return DEFAULT_EMPLOYEE_PERMISSIONS.includes(
        permission as (typeof DEFAULT_EMPLOYEE_PERMISSIONS)[number],
      );
    }
    if (user.role !== "employee") return false;
    const perms = user.permissions ?? DEFAULT_EMPLOYEE_PERMISSIONS;
    return perms.includes(permission);
  };

  return {
    user,
    isLoading: user === undefined,
    isAdmin: effectiveAdmin,
    isActualAdmin: actuallyAdmin,
    isEmployee: user?.role === "employee" || (actuallyAdmin && isStaffView),
    isDonor: user?.role === "donor",
    hasPortalAccess: user?.role === "admin" || user?.role === "employee",
    hasPermission,
    hasRole: (roles: Array<"admin" | "employee" | "donor">) => {
      if (actuallyAdmin && isStaffView) {
        return roles.includes("employee");
      }
      return user ? roles.includes(user.role) : false;
    },
  };
}
