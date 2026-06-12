import { useUserRole } from "@/hooks/use-user-role.ts";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

/**
 * Wraps a portal page and shows a friendly "no access" screen
 * if the user lacks the required permission.
 */
export default function PermissionGuard({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { hasPermission, isLoading } = useUserRole();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-20 text-center">
        <ShieldX className="w-14 h-14 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Oops, you no longer have access to this page
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Your permissions may have changed. Contact an admin if you think this is a mistake.
        </p>
        <Button
          onClick={() => navigate("/portal")}
          className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
