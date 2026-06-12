import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role.ts";
import {
  Users,
  Send,
  Search,
  ChevronRight,
  ShieldCheck,
  UserX,
  UserCheck,
  Star,
  Clock,
  X,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  ALL_PERMISSIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS,
  PERMISSION_LABELS,
} from "@/convex/permissions.ts";
import type { Permission } from "@/convex/permissions.ts";

export default function StaffListPage() {
  const { isAdmin, user, hasPermission } = useUserRole();
  const navigate = useNavigate();
  const staffData = useQuery(api.staff.list);
  const inviteStaffMutation = useMutation(api.staff.inviteStaff);
  const removeStaffMutation = useMutation(api.staff.removeStaff);
  const restoreStaffMutation = useMutation(api.staff.restoreStaff);
  const cancelInvitationMutation = useMutation(api.staff.cancelInvitation);
  const updateInvitationPermsMutation = useMutation(api.staff.updateInvitationPermissions);

  const [search, setSearch] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editInvitationPerms, setEditInvitationPerms] = useState<{
    id: Id<"staffInvitations">;
    name: string;
    permissions: Permission[];
  } | null>(null);
  const [editingPerms, setEditingPerms] = useState<Permission[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{
    id: Id<"users">;
    name: string;
  } | null>(null);

  // Invite form state
  const [email, setEmail] = useState("");
  const [prestigeLevel, setPrestigeLevel] = useState<number>(1);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    [...DEFAULT_EMPLOYEE_PERMISSIONS],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PRESTIGE_TIER_NAMES: Record<number, string> = {
    1: "Prestige 1",
    2: "Prestige 2",
    3: "Prestige 3",
    4: "Prestige 4",
    5: "Prestige 5",
  };

  const PRESTIGE_TIER_DETAILS: Record<number, { baseSalary: number; commissionRate: number }> = {
    1: { baseSalary: 100, commissionRate: 0.2 },
    2: { baseSalary: 150, commissionRate: 0.5 },
    3: { baseSalary: 250, commissionRate: 1.0 },
    4: { baseSalary: 500, commissionRate: 2.5 },
    5: { baseSalary: 1500, commissionRate: 3.9 },
  };

  const getPrestigeBadge = (level: number) =>
    level === 1 ? "Prestige 1" : `P${level}`;

  if (staffData === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (staffData === null) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
        <p className="text-sm text-muted-foreground">No staff data available.</p>
      </div>
    );
  }

  const { staff, pendingInvitations } = staffData;

  const filtered = staff.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const filteredInvitations = pendingInvitations.filter((inv) => {
    const q = search.toLowerCase();
    return (
      (inv.firstName?.toLowerCase().includes(q) ?? false) ||
      (inv.lastName?.toLowerCase().includes(q) ?? false) ||
      inv.email.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setEmail("");
    setPrestigeLevel(1);
    setSelectedPermissions([...DEFAULT_EMPLOYEE_PERMISSIONS]);
  };

  const togglePermission = (permission: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteStaffMutation({
        email: email.trim(),
        prestigeLevel,
        permissions: selectedPermissions,
      });
      toast.success(`Invitation sent to ${email.trim()}`);
      setShowInviteDialog(false);
      resetForm();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to send invitation");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: Id<"users">) => {
    try {
      await removeStaffMutation({ userId });
      toast.success("Staff member access revoked");
      setConfirmRemove(null);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to remove staff member");
      }
    }
  };

  const handleRestore = async (userId: Id<"users">) => {
    try {
      await restoreStaffMutation({ userId });
      toast.success("Staff member access restored");
    } catch (error) {
      toast.error("Failed to restore staff member");
    }
  };

  const handleCancelInvitation = async (invitationId: Id<"staffInvitations">) => {
    try {
      await cancelInvitationMutation({ invitationId });
      toast.success("Invitation cancelled");
    } catch (error) {
      toast.error("Failed to cancel invitation");
    }
  };

  const handleSaveInvitationPerms = async () => {
    if (!editInvitationPerms) return;
    if (editingPerms.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }
    setIsSavingPerms(true);
    try {
      await updateInvitationPermsMutation({
        invitationId: editInvitationPerms.id,
        permissions: editingPerms,
      });
      toast.success("Permissions updated");
      setEditInvitationPerms(null);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to update permissions");
      }
    } finally {
      setIsSavingPerms(false);
    }
  };

  const totalCount = staff.length + pendingInvitations.length;

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} team member{totalCount !== 1 ? "s" : ""}
            {pendingInvitations.length > 0 && (
              <> ({pendingInvitations.length} pending)</>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
        >
          <Send className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border placeholder:text-muted-foreground focus-visible:ring-[#1B4332]"
        />
      </div>

      {/* Pending Invitations */}
      {filteredInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pending Invitations
          </h2>
          <div className="space-y-2">
            {filteredInvitations.map((inv) => (
              <div
                key={inv._id}
                className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                  {inv.email[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-foreground truncate">
                      {inv.email}
                    </h3>
                    <Badge className="bg-amber-100 text-amber-700 shrink-0 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PRESTIGE_TIER_NAMES[inv.prestigeLevel] ?? `P${inv.prestigeLevel}`}
                    {" · "}
                    {inv.permissions.length} permission{inv.permissions.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditInvitationPerms({
                        id: inv._id,
                        name: inv.email,
                        permissions: inv.permissions as Permission[],
                      });
                      setEditingPerms(inv.permissions as Permission[]);
                    }}
                    className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCancelInvitation(inv._id)}
                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff list */}
      {filtered.length === 0 && filteredInvitations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>
              {search ? "No matching staff" : "No staff members yet"}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? "Try a different search term"
                : "Invite your first team member to get started"}
            </EmptyDescription>
          </EmptyHeader>
          {!search && (
            <EmptyContent>
              <Button
                size="sm"
                onClick={() => setShowInviteDialog(true)}
                className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
              >
                Invite
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          {filtered.length > 0 && filteredInvitations.length > 0 && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Active Staff
            </h2>
          )}
          <div className="space-y-2">
            {filtered.map((member) => {
              const isDeactivated = member.role === "donor";
              // Non-admin users cannot view admin profiles
              const canNavigate = !isDeactivated && (isAdmin || member.role !== "admin");
              return (
                <div
                  key={member._id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border bg-card transition-shadow",
                    !canNavigate
                      ? "border-border opacity-60"
                      : "border-border hover:shadow-sm cursor-pointer",
                  )}
                  onClick={() => {
                    if (canNavigate) navigate(`/portal/staff/${member._id}`);
                  }}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      member.role === "admin"
                        ? "bg-[#1B4332] text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-foreground truncate">
                        {member.name}
                      </h3>
                      {member.prestige && member.role !== "admin" && (
                        <Badge className="bg-amber-100 text-amber-700 shrink-0 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          {getPrestigeBadge(member.prestige.prestigeLevel)}
                        </Badge>
                      )}
                      {member.role === "admin" && (
                        <Badge className="bg-[#1B4332]/10 dark:bg-[#1B4332]/30 text-[#1B4332] dark:text-emerald-400 shrink-0 text-xs">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user && member._id === user._id && (
                        <Badge className="bg-blue-100 text-blue-700 shrink-0 text-xs">
                          You
                        </Badge>
                      )}
                      {isDeactivated && (
                        <Badge className="bg-red-100 text-red-700 shrink-0 text-xs">
                          Deactivated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {member.campaignCount} campaign{member.campaignCount !== 1 ? "s" : ""}
                      {member.prestige && (
                        <> &middot; <Star className="inline w-3 h-3 mb-0.5" /> {PRESTIGE_TIER_NAMES[member.prestige.prestigeLevel] ?? `P${member.prestige.prestigeLevel}`}</>
                      )}
                      {member.permissions && member.role !== "admin" && (
                        <> &middot; {member.permissions.length} permission{member.permissions.length !== 1 ? "s" : ""}</>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isDeactivated ? (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(member._id);
                        }}
                        className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    ) : member.role !== "admin" ? (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRemove({ id: member._id, name: member.name });
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    ) : null}
                    {!isDeactivated && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Invite Staff Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Enter their email and set permissions. They'll provide their name when they first log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="staffEmail">Email</Label>
              <Input
                id="staffEmail"
                type="email"
                placeholder="james@hopebuilt.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prestigeLevel">Prestige Level</Label>
              <select
                id="prestigeLevel"
                value={prestigeLevel}
                onChange={(e) => setPrestigeLevel(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              >
                {([1, 2, 3, 4, 5] as const).map((lvl) => {
                  const tier = PRESTIGE_TIER_DETAILS[lvl];
                  return (
                    <option key={lvl} value={lvl}>
                      {PRESTIGE_TIER_NAMES[lvl]} — ${tier.baseSalary}/wk · {tier.commissionRate}% commission
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>Permissions</Label>
              <p className="text-xs text-muted-foreground">
                Select which sections this staff member can access.
              </p>
              {/* Admin Permissions */}
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">Admin</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(["staff", "donors", "analytics", "leaderboard", "prestige"] as const).map((permission) => (
                  <label
                    key={permission}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedPermissions.includes(permission)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <Checkbox
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm text-foreground">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </label>
                ))}
              </div>

              {/* Staff Permissions */}
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-3">Staff</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(["dashboard", "campaigns", "new_campaign", "finance"] as const).map((permission) => (
                  <label
                    key={permission}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedPermissions.includes(permission)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <Checkbox
                      checked={selectedPermissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm text-foreground">
                      {PERMISSION_LABELS[permission]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowInviteDialog(false);
                resetForm();
              }}
              variant="secondary"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isSubmitting}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog
        open={confirmRemove !== null}
        onOpenChange={() => setConfirmRemove(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure you want to remove {confirmRemove?.name}?</DialogTitle>
            <DialogDescription>
              {confirmRemove?.name} will lose all portal access. Their campaigns
              and data will be preserved. You can restore them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setConfirmRemove(null)}
              className="bg-muted hover:bg-accent text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRemove && handleRemove(confirmRemove.id)}
              className="cursor-pointer"
            >
              Remove Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invitation Permissions Dialog */}
      <Dialog
        open={editInvitationPerms !== null}
        onOpenChange={() => setEditInvitationPerms(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {editInvitationPerms?.name}'s pending invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Permissions</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    editingPerms.includes(permission)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <Checkbox
                    checked={editingPerms.includes(permission)}
                    onCheckedChange={() => {
                      setEditingPerms((prev) =>
                        prev.includes(permission)
                          ? prev.filter((p) => p !== permission)
                          : [...prev, permission],
                      );
                    }}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-foreground">
                    {PERMISSION_LABELS[permission]}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setEditInvitationPerms(null)}
              variant="secondary"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveInvitationPerms}
              disabled={isSavingPerms}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
            >
              {isSavingPerms ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
