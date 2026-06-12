import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role.ts";
import {
  Crown,
  Users,
  Star,
  ChevronRight,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type TierStyleInfo = {
  label: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
};

const TIER_STYLES: Record<number, TierStyleInfo> = {
  1: { label: "Prestige 1", bgClass: "bg-slate-100", textClass: "text-slate-700", badgeClass: "bg-slate-100 text-slate-700" },
  2: { label: "Prestige 2", bgClass: "bg-blue-100", textClass: "text-blue-700", badgeClass: "bg-blue-100 text-blue-700" },
  3: { label: "Prestige 3", bgClass: "bg-purple-100", textClass: "text-purple-700", badgeClass: "bg-purple-100 text-purple-700" },
  4: { label: "Prestige 4", bgClass: "bg-amber-100", textClass: "text-amber-700", badgeClass: "bg-amber-100 text-amber-700" },
  5: { label: "Prestige 5", bgClass: "bg-emerald-100", textClass: "text-emerald-700", badgeClass: "bg-emerald-100 text-emerald-700" },
};

const TIER_OPTIONS = [
  { value: "1", label: "1 — Prestige 1 ($100/wk, 0.2%)" },
  { value: "2", label: "2 — Prestige 2 ($150/wk, 0.5%)" },
  { value: "3", label: "3 — Prestige 3 ($250/wk, 1%)" },
  { value: "4", label: "4 — Prestige 4 ($500/wk, 2.5%)" },
  { value: "5", label: "5 — Prestige 5 ($1,500/wk, 3.9%)" },
];

export default function PrestigeManagementPage() {
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const overview = useQuery(api.prestige.getAdminOverview);
  const updateStaff = useMutation(api.staff.updateStaff);

  const [editEmployee, setEditEmployee] = useState<{
    _id: Id<"users">;
    name: string;
    prestigeLevel: string;
    cumulativeEarnings: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (overview === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const { employees, tierDistribution } = overview;

  const handleEditOpen = (emp: (typeof employees)[number]) => {
    setEditEmployee({
      _id: emp._id,
      name: emp.name,
      prestigeLevel: emp.prestigeLevel.toString(),
      cumulativeEarnings: emp.cumulativeEarnings.toString(),
    });
  };

  const handleSave = async () => {
    if (!editEmployee) return;
    const level = parseInt(editEmployee.prestigeLevel);
    const cumulative = parseFloat(editEmployee.cumulativeEarnings);

    if (isNaN(level) || level < 1 || level > 5) {
      toast.error("Please select a valid prestige level (1-5)");
      return;
    }
    if (isNaN(cumulative)) {
      toast.error("Please enter a valid cumulative earnings amount");
      return;
    }

    setIsSaving(true);
    try {
      await updateStaff({
        userId: editEmployee._id,
        name: editEmployee.name.trim() || undefined,
        prestigeLevel: level,
        cumulativeEarnings: cumulative,
      });
      toast.success("Prestige updated successfully");
      setEditEmployee(null);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to update prestige");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Prestige Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of all employee tiers, payroll, and progression
        </p>
      </div>

      {/* Tier distribution */}
      <div className="rounded-xl border border-border bg-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Tier Distribution</h2>
        <div className="grid grid-cols-5 gap-3">
          {tierDistribution.map((t) => {
            const style = TIER_STYLES[t.level] ?? TIER_STYLES[1];
            return (
              <div key={t.level} className="text-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2",
                  style.bgClass,
                )}>
                  <Crown className={cn("w-4 h-4", style.textClass)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{t.count}</p>
                <p className="text-xs text-muted-foreground">{t.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee list */}
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
        All Employees
      </h2>

      {employees.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Users /></EmptyMedia>
            <EmptyTitle>No employees yet</EmptyTitle>
            <EmptyDescription>Add staff members from the Staff page to manage their prestige</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => {
            const style = TIER_STYLES[emp.prestigeLevel] ?? TIER_STYLES[1];
            const progressPercent =
              emp.donorsToNextTier && emp.donorsToNextTier > 0
                ? Math.min(
                    100,
                    emp.uniqueDonorCount > 0
                      ? Math.max(1, Math.round(((emp.donorsToNextTier - emp.donorsRemaining) / emp.donorsToNextTier) * 100))
                      : 0,
                  )
                : emp.prestigeLevel === 5
                ? 100
                : 0;

            return (
              <div
                key={emp._id}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Tier icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    style.bgClass,
                  )}>
                    <Crown className={cn("w-4 h-4", style.textClass)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3
                        className="font-semibold text-foreground truncate cursor-pointer hover:underline"
                        onClick={() => navigate(`/portal/staff/${emp._id}`)}
                      >
                        {emp.name}
                      </h3>
                      <Badge className={cn("shrink-0 text-xs", style.badgeClass)}>
                        <Star className="w-3 h-3 mr-1" />
                        {style.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${emp.baseSalary}/wk base &middot; {(emp.commissionRate * 100).toFixed(1)}% commission &middot; {emp.uniqueDonorCount.toLocaleString()} donor{emp.uniqueDonorCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Financials */}
                  <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                    <p className="text-sm font-semibold text-[#1B4332] dark:text-emerald-400">
                      ${emp.commissionEarned.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">commission</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      className="bg-muted hover:bg-accent text-foreground cursor-pointer"
                      onClick={() => handleEditOpen(emp)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <ChevronRight
                      className="w-4 h-4 text-muted-foreground cursor-pointer"
                      onClick={() => navigate(`/portal/staff/${emp._id}`)}
                    />
                  </div>
                </div>

                {/* Progress bar to next tier */}
                {emp.prestigeLevel < 5 && (
                  <div className="mt-3 ml-14">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">
                        Progress to {emp.nextTierName}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {progressPercent}%
                      </p>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {emp.donorsRemaining.toLocaleString()} donor{emp.donorsRemaining !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                )}
                {emp.prestigeLevel === 5 && (
                  <div className="mt-3 ml-14">
                    <p className="text-xs text-emerald-600 font-medium">Max tier reached</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tier reference table */}
      <div className="rounded-xl border border-border bg-card p-5 mt-8">
        <h2 className="text-sm font-semibold text-foreground mb-4">Tier Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">Tier</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">Base Salary</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">Commission</th>
                <th className="text-right py-2 px-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">Donors to Unlock Next</th>
              </tr>
            </thead>
            <tbody>
              {tierDistribution.map((t) => {
                const style = TIER_STYLES[t.level] ?? TIER_STYLES[1];
                return (
                  <tr key={t.level} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", style.badgeClass)}>
                          <Crown className="w-3 h-3 mr-1" />
                          {style.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="text-right py-2.5 px-3 font-medium text-foreground">${t.baseSalary}/wk</td>
                    <td className="text-right py-2.5 px-3 font-medium text-[#1B4332] dark:text-emerald-400">{(t.commissionRate * 100).toFixed(1)}%</td>
                    <td className="text-right py-2.5 px-3 text-muted-foreground">
                      {t.donorsToNextTier.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit prestige dialog */}
      <Dialog open={editEmployee !== null} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Prestige</DialogTitle>
            <DialogDescription>
              Update {editEmployee?.name}&apos;s prestige tier and cumulative earnings.
            </DialogDescription>
          </DialogHeader>
          {editEmployee && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="editPrestigeName" className="text-foreground">Full Name</Label>
                <Input
                  id="editPrestigeName"
                  value={editEmployee.name}
                  onChange={(e) =>
                    setEditEmployee({ ...editEmployee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPrestigeLevel" className="text-foreground">Prestige Level</Label>
                <Select
                  value={editEmployee.prestigeLevel}
                  onValueChange={(val) =>
                    setEditEmployee({ ...editEmployee, prestigeLevel: val })
                  }
                >
                  <SelectTrigger id="editPrestigeLevel" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPrestigeCumulative" className="text-foreground">
                  Cumulative Earnings ($)
                </Label>
                <Input
                  id="editPrestigeCumulative"
                  type="number"
                  value={editEmployee.cumulativeEarnings}
                  onChange={(e) =>
                    setEditEmployee({ ...editEmployee, cumulativeEarnings: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setEditEmployee(null)}
              className="bg-muted hover:bg-accent text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleSave}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
