import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  DollarSign,
  CalendarIcon,
  Wallet,
  Bitcoin,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Users,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  QrCode,
  Copy,
  History,
  Hash,
  ChevronDown,
  ChevronUp,
  Gift,
  XCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";
import QRCode from "qrcode";

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", class: "bg-blue-100 text-blue-800", icon: Clock },
  awaiting_confirmation: { label: "Awaiting Confirmation", class: "bg-amber-100 text-amber-800", icon: Clock },
  pending_confirmation: { label: "Pending", class: "bg-amber-100 text-amber-800", icon: Loader2 },
  paid: { label: "Paid", class: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
} as const;

/** Build an explorer URL for a transaction hash */
function getExplorerUrl(txHash: string, network: "btc" | "trc20" | string): string {
  if (network === "btc") {
    return `https://blockstream.info/tx/${txHash}`;
  }
  return `https://tronscan.org/#/transaction/${txHash}`;
}

export default function AdminFinancePage() {
  const { isAdmin } = useUserRole();
  const overview = useQuery(api.payroll.getAdminPayrollOverview);
  const markAsPaidMutation = useMutation(api.payroll.markAsPaid);
  const cancelPayoutMutation = useMutation(api.payroll.cancelPayout);
  const [search, setSearch] = useState("");
  const [payDialog, setPayDialog] = useState<{
    employeeId: Id<"users">;
    employeeName: string;
    totalAmount: number;
    btcAddress: string;
    usdtAddress: string;
  } | null>(null);
  const [customPayDialog, setCustomPayDialog] = useState(false);
  const [hashDialog, setHashDialog] = useState<{
    payrollId: Id<"payrolls">;
    employeeName: string;
    totalAmount: number;
  } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{
    payrollId: Id<"payrolls">;
  } | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  if (!isAdmin) {
    return <StaffFinanceView />;
  }

  if (overview === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const filtered = overview.employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee payouts and payment status.</p>
        </div>
        <Button
          onClick={() => setCustomPayDialog(true)}
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
          size="sm"
        >
          <Gift className="w-4 h-4 mr-1.5" />
          Custom Payout
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Next Payout</p>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-700">
            ${overview.totalNextPayout.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Combined weekly payout for {overview.employees.length} employee{overview.employees.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Staff Count</p>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {overview.employees.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Active employees</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="pl-9"
        />
      </div>

      {/* Employee payroll list */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border/50">
        <div className="px-5 py-3 bg-muted rounded-t-xl">
          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
            <div className="col-span-4">Employee</div>
            <div className="col-span-2 text-right">Base</div>
            <div className="col-span-2 text-right">Commission</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No employees found.</p>
          </div>
        )}

        {filtered.map((emp) => {
          const latestStatus = emp.latestPayroll?.status ?? "scheduled";
          const statusConfig = STATUS_CONFIG[latestStatus];
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedEmployee === emp._id;

          return (
            <div key={emp._id}>
              {/* Main employee row — clickable to expand */}
              <div
                className="px-5 py-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() => setExpandedEmployee(isExpanded ? null : emp._id)}
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{emp.tierName}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] dark:text-emerald-400 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CalendarIcon className="w-3 h-3" />
                            {format(new Date(emp.nextPayoutDate + "T00:00:00"), "EEE, MMM d")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-medium text-foreground">${emp.baseSalary}</p>
                    <p className="text-xs text-muted-foreground">/week</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-medium text-foreground">${emp.commissionAmount.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-bold text-emerald-700">${emp.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Badge className={cn("text-xs shrink-0", statusConfig.class)}>
                      <StatusIcon className={cn("w-3 h-3 mr-1", latestStatus === "pending_confirmation" ? "animate-spin" : "")} />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  {emp.bitcoinAddress && (
                    <span className="text-amber-600" title={`BTC: ${emp.bitcoinAddress}`}>
                      <Bitcoin className="w-4 h-4" />
                    </span>
                  )}
                  {emp.usdtTrc20Address && (
                    <span className="text-emerald-600" title={`USDT: ${emp.usdtTrc20Address}`}>
                      <Wallet className="w-4 h-4" />
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {latestStatus === "scheduled" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayDialog({
                              employeeId: emp._id,
                              employeeName: emp.name,
                              totalAmount: emp.totalAmount,
                              btcAddress: emp.bitcoinAddress,
                              usdtAddress: emp.usdtTrc20Address,
                            });
                          }}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Pay Now
                        </Button>
                      </div>
                    )}
                    {latestStatus === "awaiting_confirmation" && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Awaiting hash...
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-red-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!emp.latestPayroll?._id) return;
                            setCancelConfirm({ payrollId: emp.latestPayroll._id as Id<"payrolls"> });
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (emp.latestPayroll?._id) {
                              setHashDialog({
                                payrollId: emp.latestPayroll._id as Id<"payrolls">,
                                employeeName: emp.name,
                                totalAmount: emp.latestPayroll.totalAmount,
                              });
                            }
                          }}
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          Enter Hash
                        </Button>
                      </div>
                    )}
                    {latestStatus === "pending_confirmation" && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Verifying on-chain...
                        </span>
                        {emp.latestPayroll?.txHash && emp.latestPayroll?.txNetwork && (
                          <a
                            href={getExplorerUrl(emp.latestPayroll.txHash, emp.latestPayroll.txNetwork)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="View on blockchain explorer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!emp.latestPayroll?._id || !emp.latestPayroll?.txHash || !emp.latestPayroll?.txNetwork) return;
                            try {
                              await markAsPaidMutation({
                                payrollId: emp.latestPayroll._id as Id<"payrolls">,
                                txHash: emp.latestPayroll.txHash,
                                txNetwork: emp.latestPayroll.txNetwork as "btc" | "trc20",
                              });
                              toast.success("Payment manually confirmed");
                            } catch (error) {
                              if (error instanceof ConvexError) {
                                const data = error.data as { message: string };
                                toast.error(data.message);
                              } else {
                                toast.error("Failed to mark as paid");
                              }
                            }
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Mark Paid
                        </Button>
                      </div>
                    )}
                    {latestStatus === "paid" && emp.latestPayroll?.confirmedAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Paid {format(new Date(emp.latestPayroll.confirmedAt), "MMM d")}
                        </span>
                        {emp.latestPayroll?.txHash && emp.latestPayroll?.txNetwork && (
                          <a
                            href={getExplorerUrl(emp.latestPayroll.txHash, emp.latestPayroll.txNetwork)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="View on blockchain explorer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded payout history for this employee */}
              {isExpanded && (
                <EmployeePayoutHistory
                  employee={emp}
                  onOpenHashDialog={(payrollId, totalAmount) =>
                    setHashDialog({ payrollId, employeeName: emp.name, totalAmount })
                  }
                  onCancelPayout={(payrollId) =>
                    setCancelConfirm({ payrollId })
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Pay dialog */}
      {payDialog && (
        <PaymentDialog
          open={!!payDialog}
          onOpenChange={(open) => !open && setPayDialog(null)}
          employeeId={payDialog.employeeId}
          employeeName={payDialog.employeeName}
          totalAmount={payDialog.totalAmount}
          btcAddress={payDialog.btcAddress}
          usdtAddress={payDialog.usdtAddress}
        />
      )}

      {/* Custom Payout dialog */}
      <CustomPayoutDialog
        open={customPayDialog}
        onOpenChange={setCustomPayDialog}
        employees={overview.employees}
      />

      {/* Hash Entry dialog */}
      {hashDialog && (
        <HashEntryDialog
          open={!!hashDialog}
          onOpenChange={(open) => !open && setHashDialog(null)}
          payrollId={hashDialog.payrollId}
          employeeName={hashDialog.employeeName}
          totalAmount={hashDialog.totalAmount}
        />
      )}

      {/* Cancel Payout Confirmation Dialog */}
      <Dialog open={!!cancelConfirm} onOpenChange={(open) => !open && setCancelConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Payout</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this payout? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setCancelConfirm(null)}
            >
              Keep Payout
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={async () => {
                if (!cancelConfirm) return;
                try {
                  await cancelPayoutMutation({ payrollId: cancelConfirm.payrollId });
                  toast.success("Payout cancelled successfully");
                  setCancelConfirm(null);
                } catch (error) {
                  if (error instanceof ConvexError) {
                    const data = error.data as { message: string };
                    toast.error(data.message);
                  } else {
                    toast.error("Failed to cancel payout");
                  }
                }
              }}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Inline payout history shown when an employee row is expanded.
 * Uses the recentPayrolls data already fetched from the overview query.
 */
type EmployeeOverview = {
  _id: Id<"users">;
  name: string;
  recentPayrolls: {
    _id: string;
    status: "scheduled" | "awaiting_confirmation" | "pending_confirmation" | "paid";
    totalAmount: number;
    baseSalary: number;
    commissionAmount: number;
    txHash?: string;
    txNetwork?: string;
    walletAddress?: string;
    confirmedAt?: string;
    periodStart: string;
    periodEnd: string;
    note?: string;
    createdAt: number;
  }[];
};

function EmployeePayoutHistory({
  employee,
  onOpenHashDialog,
  onCancelPayout,
}: {
  employee: EmployeeOverview;
  onOpenHashDialog: (payrollId: Id<"payrolls">, totalAmount: number) => void;
  onCancelPayout: (payrollId: Id<"payrolls">) => void;
}) {
  const payrolls = employee.recentPayrolls;
  const updateNetwork = useMutation(api.payroll.updatePayrollNetwork);

  async function handleToggleNetwork(
    payrollId: Id<"payrolls">,
    current: "btc" | "trc20" | undefined,
  ) {
    const next: "btc" | "trc20" = current === "btc" ? "trc20" : "btc";
    try {
      await updateNetwork({ payrollId, txNetwork: next });
      toast.success(`Network updated to ${next === "btc" ? "Bitcoin" : "USDT (TRC20)"}`);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to update network");
      }
    }
  }

  return (
    <div className="bg-muted border-t border-border px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Payout History</h3>
        {payrolls.length > 0 && (
          <Badge className="bg-muted text-muted-foreground text-xs">
            {payrolls.length}
          </Badge>
        )}
      </div>

      {payrolls.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-medium text-muted-foreground">No payouts recorded yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Date</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Amount</th>
                  <th className="text-center px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Status</th>
                  <th className="text-left px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Network</th>
                  <th className="text-left px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">TX Hash</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {payrolls.map((p) => {
                  const statusConfig = STATUS_CONFIG[p.status];
                  const StatusIcon = statusConfig.icon;
                  // For scheduled payouts, show the upcoming period date (e.g., next Friday).
                  // For confirmed/paid payouts, show the actual confirmation time.
                  // Fall back to creation time for anything else.
                  const paidDate = p.status === "scheduled"
                    ? new Date(p.periodStart + "T00:00:00")
                    : p.confirmedAt
                      ? new Date(p.confirmedAt)
                      : new Date(p.createdAt);
                  const truncatedHash = p.txHash
                    ? `${p.txHash.slice(0, 8)}...${p.txHash.slice(-6)}`
                    : null;

                  return (
                    <tr key={p._id} className="hover:bg-accent transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="text-xs text-foreground font-medium">
                          {format(paidDate, "MMM d, yyyy")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(paidDate, "h:mm a")}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <p className="text-xs font-bold text-emerald-700">
                          ${p.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Base: ${p.baseSalary} + ${p.commissionAmount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge className={cn("text-[10px]", statusConfig.class)}>
                          <StatusIcon className={cn("w-2.5 h-2.5 mr-0.5", p.status === "pending_confirmation" ? "animate-spin" : "")} />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.txNetwork ? (
                          <button
                            type="button"
                            onClick={() => handleToggleNetwork(p._id as Id<"payrolls">, p.txNetwork as "btc" | "trc20")}
                            title="Click to switch network"
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-foreground hover:text-[#1B4332] cursor-pointer underline-offset-2 hover:underline"
                          >
                            {p.txNetwork === "btc" ? "Bitcoin" : "USDT (TRC20)"}
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {truncatedHash && p.txHash ? (
                          <div className="flex items-center gap-1">
                            <Hash className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                            <span className="text-[10px] font-mono text-foreground" title={p.txHash}>
                              {truncatedHash}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(p.txHash ?? "");
                                toast.success("Transaction hash copied");
                              }}
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                            {p.txNetwork && (
                              <a
                                href={getExplorerUrl(p.txHash, p.txNetwork)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ) : p.status === "awaiting_confirmation" ? (
                          <Button
                            size="sm"
                            className="h-5 text-[10px] bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer px-2"
                            onClick={() =>
                              onOpenHashDialog(p._id as Id<"payrolls">, p.totalAmount)
                            }
                          >
                            <Hash className="w-2.5 h-2.5 mr-0.5" />
                            Enter Hash
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {p.status === "awaiting_confirmation" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 text-[10px] text-destructive hover:text-destructive hover:bg-red-50 cursor-pointer px-2"
                            onClick={() => onCancelPayout(p._id as Id<"payrolls">)}
                          >
                            <XCircle className="w-2.5 h-2.5 mr-0.5" />
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payrolls.length >= 10 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Showing most recent 10 payouts
        </p>
      )}
    </div>
  );
}

/**
 * Admin button to manually mark a pending payment as paid (override).
 * Used when blockchain auto-verification times out or can't reach the API.
 */
function MarkPaidButton({
  payrollId,
  txHash,
  txNetwork,
}: {
  payrollId?: string;
  txHash?: string;
  txNetwork?: string;
}) {
  const markAsPaid = useMutation(api.payroll.markAsPaid);
  const [loading, setLoading] = useState(false);

  if (!payrollId || !txHash || !txNetwork) return null;

  async function handleClick() {
    setLoading(true);
    try {
      await markAsPaid({
        payrollId: payrollId as Id<"payrolls">,
        txHash: txHash ?? "",
        txNetwork: (txNetwork ?? "btc") as "btc" | "trc20",
      });
      toast.success("Payment manually confirmed");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to mark as paid");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className="h-6 text-xs cursor-pointer"
      onClick={handleClick}
      disabled={loading}
      title="Manually confirm this payment"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
      Mark Paid
    </Button>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  totalAmount,
  btcAddress,
  usdtAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: Id<"users">;
  employeeName: string;
  totalAmount: number;
  btcAddress: string;
  usdtAddress: string;
}) {
  const submitPayment = useMutation(api.payroll.submitPaymentHash);
  const fetchCryptoPrices = useAction(api.cryptoPrices.getCryptoPrices);
  const [submitting, setSubmitting] = useState(false);

  // Crypto price state
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [usdtPrice, setUsdtPrice] = useState<number | null>(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState(false);

  // QR code data URLs
  const [btcQr, setBtcQr] = useState<string | null>(null);
  const [usdtQr, setUsdtQr] = useState<string | null>(null);

  // Fetch crypto prices when dialog opens, then refresh every 5 minutes
  useEffect(() => {
    if (!open) return;

    function loadPrices() {
      setPricesLoading(true);
      setPricesError(false);
      fetchCryptoPrices({})
        .then((result) => {
          setBtcPrice(result.btcPrice);
          setUsdtPrice(result.usdtPrice);
        })
        .catch(() => {
          setPricesError(true);
        })
        .finally(() => {
          setPricesLoading(false);
        });
    }

    loadPrices();
    const interval = setInterval(loadPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [open, fetchCryptoPrices]);

  // Calculate crypto amounts
  const btcAmount = btcPrice && btcPrice > 0 ? totalAmount / btcPrice : null;
  const usdtAmount = usdtPrice && usdtPrice > 0 ? totalAmount / usdtPrice : null;

  // Generate QR codes when prices and addresses are available
  useEffect(() => {
    if (!open) return;

    if (btcAddress && btcAmount !== null) {
      const label = encodeURIComponent(`HopeBuilt Payroll`);
      const message = encodeURIComponent(`Payout to ${employeeName} — $${totalAmount.toLocaleString()} USD`);
      const btcUri = `bitcoin:${btcAddress}?amount=${btcAmount.toFixed(8)}&label=${label}&message=${message}`;
      QRCode.toDataURL(btcUri, { width: 256, margin: 2, errorCorrectionLevel: "H", color: { dark: "#121212", light: "#ffffff" } })
        .then(setBtcQr)
        .catch(() => setBtcQr(null));
    } else {
      setBtcQr(null);
    }

    if (usdtAddress && usdtAmount !== null) {
      const usdtUri = usdtAddress;
      QRCode.toDataURL(usdtUri, { width: 256, margin: 2, errorCorrectionLevel: "H", color: { dark: "#121212", light: "#ffffff" } })
        .then(setUsdtQr)
        .catch(() => setUsdtQr(null));
    } else {
      setUsdtQr(null);
    }
  }, [open, btcAddress, usdtAddress, btcAmount, usdtAmount, employeeName, totalAmount]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitPayment({ employeeId });
      toast.success("Payment initiated! You can now enter the transaction hash from the payroll list.");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to initiate payment");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Review wallet details for {employeeName}&apos;s payout of ${totalAmount.toLocaleString()}. Click &quot;Initiate Payment&quot; to mark it as awaiting confirmation, then enter the transaction hash after sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount display */}
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-xs text-emerald-700 uppercase tracking-wide font-medium">Payout Amount</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">${totalAmount.toLocaleString()}</p>
            {pricesLoading && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Fetching live exchange rates...
              </p>
            )}
            {pricesError && (
              <p className="text-xs text-amber-600 mt-1">Could not fetch live rates. Pay the USD equivalent manually.</p>
            )}
          </div>

          {/* Wallet addresses with QR codes */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Employee Wallet Addresses</p>

            {btcAddress && (
              <div className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Bitcoin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">Bitcoin (BTC)</p>
                      {btcAmount !== null && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {btcAmount.toFixed(8)} BTC
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(btcAddress);
                        toast.success("BTC address copied to clipboard");
                      }}
                      className="text-xs font-mono text-foreground break-all mt-0.5 hover:text-amber-700 transition-colors cursor-pointer text-left flex items-center gap-1"
                    >
                      {btcAddress}
                      <Copy className="w-3 h-3 shrink-0 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                {btcQr ? (
                  <div className="flex flex-col items-center pt-2 border-t border-border">
                    <img src={btcQr} alt="Bitcoin Payment QR Code" className="w-48 h-48 rounded" />
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Scan to fill address
                    </p>
                    {btcAmount !== null && (
                      <div className="mt-2 w-full rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                        <p className="text-[10px] text-amber-600 uppercase tracking-wide font-medium mb-1">Exact Amount to Send</p>
                        <p className="text-lg font-bold font-mono text-amber-800">{btcAmount.toFixed(8)} BTC</p>
                        <p className="text-[10px] text-amber-600 mt-0.5">${totalAmount.toLocaleString()} USD @ ${btcPrice?.toLocaleString()}/BTC</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(btcAmount.toFixed(8));
                            toast.success("BTC amount copied");
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium bg-amber-700 text-white px-4 py-2 rounded-md hover:bg-amber-800 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Amount
                        </button>
                      </div>
                    )}
                  </div>
                ) : pricesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
              </div>
            )}

            {usdtAddress && (
              <div className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">USDT (TRC20)</p>
                      {usdtAmount !== null && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {usdtAmount.toFixed(2)} USDT
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(usdtAddress);
                        toast.success("USDT address copied to clipboard");
                      }}
                      className="text-xs font-mono text-foreground break-all mt-0.5 hover:text-emerald-700 transition-colors cursor-pointer text-left flex items-center gap-1"
                    >
                      {usdtAddress}
                      <Copy className="w-3 h-3 shrink-0 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                {usdtQr ? (
                  <div className="flex flex-col items-center pt-2 border-t border-border">
                    <img src={usdtQr} alt="USDT Payment QR Code" className="w-48 h-48 rounded" />
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Scan to fill address
                    </p>
                    {usdtAmount !== null && (
                      <div className="mt-2 w-full rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                        <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-medium mb-1">Exact Amount to Send</p>
                        <p className="text-lg font-bold font-mono text-emerald-800">{usdtAmount.toFixed(2)} USDT</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">${totalAmount.toLocaleString()} USD @ ${usdtPrice?.toFixed(4)}/USDT</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(usdtAmount.toFixed(2));
                            toast.success("USDT amount copied");
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-700 text-white px-4 py-2 rounded-md hover:bg-emerald-800 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Amount
                        </button>
                      </div>
                    )}
                  </div>
                ) : pricesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
              </div>
            )}

            {!btcAddress && !usdtAddress && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  This employee hasn&apos;t set up any wallet addresses yet. They can do this from their Profile page.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Check className="w-4 h-4 mr-1.5" />
            )}
            Initiated
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog for admin to enter a transaction hash for a payroll awaiting confirmation.
 * Once the hash is entered, the payroll is automatically marked as "Paid".
 */
function HashEntryDialog({
  open,
  onOpenChange,
  payrollId,
  employeeName,
  totalAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollId: Id<"payrolls">;
  employeeName: string;
  totalAmount: number;
}) {
  const addHash = useMutation(api.payroll.addTransactionHash);
  const [txHash, setTxHash] = useState("");
  const [txNetwork, setTxNetwork] = useState<"btc" | "trc20">("btc");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!txHash.trim()) {
      toast.error("Please enter a transaction hash");
      return;
    }
    setSubmitting(true);
    try {
      const result = await addHash({ payrollId, txHash: txHash.trim(), txNetwork });
      const networkLabel = result.txNetwork === "btc" ? "Bitcoin" : "USDT (TRC20)";
      toast.success(`Payment confirmed as ${networkLabel}! Staff can now view the hash.`);
      setTxHash("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to confirm payment");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Transaction Hash</DialogTitle>
          <DialogDescription>
            Enter the blockchain transaction hash for {employeeName}&apos;s payout of ${totalAmount.toLocaleString()}. This will confirm the payment and notify the employee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-xs text-emerald-700 uppercase tracking-wide font-medium">Payout Amount</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">${totalAmount.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label>Network</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxNetwork("btc")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  txNetwork === "btc"
                    ? "border-[#F7931A] bg-[#F7931A]/10 text-[#F7931A]"
                    : "border-border bg-card text-muted-foreground hover:bg-accent",
                )}
              >
                <Bitcoin className="w-4 h-4" />
                Bitcoin
              </button>
              <button
                type="button"
                onClick={() => setTxNetwork("trc20")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  txNetwork === "trc20"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-border bg-card text-muted-foreground hover:bg-accent",
                )}
              >
                <Wallet className="w-4 h-4" />
                USDT (TRC20)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hash-input">Transaction Hash</Label>
            <Input
              id="hash-input"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter the blockchain transaction hash..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Make sure the selected network matches the actual transaction.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !txHash.trim()}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            )}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Custom Payout Dialog — allows admin to send an arbitrary amount
 * to any staff member (bonus, reimbursement, etc.).
 */
function CustomPayoutDialog({
  open,
  onOpenChange,
  employees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: {
    _id: Id<"users">;
    name: string;
    email: string;
    bitcoinAddress: string;
    usdtTrc20Address: string;
  }[];
}) {
  const submitCustomPayout = useMutation(api.payroll.submitCustomPayout);
  const [selectedEmployee, setSelectedEmployee] = useState<Id<"users"> | "">("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedEmp = employees.find((e) => e._id === selectedEmployee);

  function resetForm() {
    setSelectedEmployee("");
    setAmount("");
    setNote("");
  }

  async function handleSubmit() {
    if (!selectedEmployee) {
      toast.error("Please select a staff member");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than $0");
      return;
    }
    setSubmitting(true);
    try {
      await submitCustomPayout({
        employeeId: selectedEmployee as Id<"users">,
        amount: parsedAmount,
        note: note.trim() || undefined,
      });
      toast.success(`Custom payout of $${parsedAmount.toLocaleString()} initiated! Enter the transaction hash to confirm.`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to submit custom payout");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Payout</DialogTitle>
          <DialogDescription>
            Send a custom amount to any staff member — for bonuses, reimbursements, or one-off payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee select */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-employee">Staff Member</Label>
            <select
              id="custom-employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value as Id<"users"> | "")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4332] cursor-pointer"
            >
              <option value="">Select a staff member...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} — {emp.email}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet info for selected employee */}
          {selectedEmp && (
            <div className="rounded-lg border border-border bg-muted p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wallet Addresses</p>
              {selectedEmp.bitcoinAddress ? (
                <div className="flex items-center gap-2 text-xs">
                  <Bitcoin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-mono text-foreground break-all">{selectedEmp.bitcoinAddress}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEmp.bitcoinAddress);
                      toast.success("BTC address copied");
                    }}
                    className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              {selectedEmp.usdtTrc20Address ? (
                <div className="flex items-center gap-2 text-xs">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono text-foreground break-all">{selectedEmp.usdtTrc20Address}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEmp.usdtTrc20Address);
                      toast.success("USDT address copied");
                    }}
                    className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              {!selectedEmp.bitcoinAddress && !selectedEmp.usdtTrc20Address && (
                <p className="text-xs text-amber-700">No wallet addresses set up yet.</p>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-amount">Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="custom-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-note">Note (optional)</Label>
            <Input
              id="custom-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Q1 bonus, reimbursement, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !selectedEmployee || !amount}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Send className="w-4 h-4 mr-1.5" />
            )}
            Submit Payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Staff Finance View — shown when non-admin employees access /portal/finance.
 * Displays balance, next payout, prestige tier info, wallet management,
 * total lifetime earnings, and full payout history with blockchain explorer links.
 */
function StaffFinanceView() {
  const myPayrolls = useQuery(api.payroll.getMyPayrolls);

  if (myPayrolls === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const hasWallets = !!(myPayrolls.wallets.bitcoinAddress || myPayrolls.wallets.usdtTrc20Address);
  const pendingPayroll = myPayrolls.payrolls.find((p) => p.status === "pending_confirmation");
  const awaitingPayroll = myPayrolls.payrolls.find((p) => p.status === "awaiting_confirmation");

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">Your balance, payouts, and wallet settings.</p>
      </div>

      {/* Awaiting confirmation banner */}
      {awaitingPayroll && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4 text-blue-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900">Payment initiated</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your payout of <strong>${awaitingPayroll.totalAmount.toLocaleString()}</strong> has been initiated and is awaiting confirmation from your admin.
            </p>
          </div>
        </div>
      )}

      {/* Pending verification banner */}
      {pendingPayroll && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">Payment being verified</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your payout of <strong>${pendingPayroll.totalAmount.toLocaleString()}</strong> is being verified on the{" "}
              {pendingPayroll.txNetwork === "btc" ? "Bitcoin" : "TRON"} blockchain. This usually takes under 30 minutes.
            </p>
            {pendingPayroll.txHash && pendingPayroll.txNetwork && (
              <a
                href={getExplorerUrl(pendingPayroll.txHash, pendingPayroll.txNetwork)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-800 font-medium hover:text-amber-900 cursor-pointer underline underline-offset-2"
              >
                Track on {pendingPayroll.txNetwork === "btc" ? "Blockstream" : "TronScan"} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Current Balance */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Weekly Balance</p>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-700">
            ${myPayrolls.balance.toLocaleString()}
          </p>
          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
            <div className="flex items-center justify-between">
              <span>Base salary</span>
              <span className="font-medium text-foreground">${myPayrolls.baseSalary}/wk</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Commission ({(myPayrolls.commissionRate * 100).toFixed(1)}%)</span>
              <span className="font-medium text-foreground">${(myPayrolls.commissionAmount ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Next Payout */}
        {myPayrolls.nextPayout && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Next Payout</p>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-blue-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${myPayrolls.nextPayout.amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Scheduled for{" "}
              <span className="font-medium text-foreground">
                {format(new Date(myPayrolls.nextPayout.date + "T00:00:00"), "EEEE, MMM d")}
              </span>
            </p>
          </div>
        )}

        {/* Total Earned */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Earned</p>
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-700">
            ${myPayrolls.totalEarned.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            From {myPayrolls.paidCount} payout{myPayrolls.paidCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Prestige Tier */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-[#1B4332]/5 to-transparent p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-sm">
            {myPayrolls.tierLevel}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{myPayrolls.tierName}</p>
            <p className="text-xs text-muted-foreground">
              Base: ${myPayrolls.baseSalary}/wk &middot; Commission: {(myPayrolls.commissionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Wallet addresses section */}
      <WalletSection
        bitcoinAddress={myPayrolls.wallets.bitcoinAddress}
        usdtTrc20Address={myPayrolls.wallets.usdtTrc20Address}
      />

      {/* No wallet warning */}
      {!hasWallets && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Set up your wallet</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add at least one wallet address above so your admin can send your payouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payroll history */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Payout History</h2>
          {myPayrolls.payrolls.length > 0 && (
            <Badge className="bg-muted text-muted-foreground text-xs">
              {myPayrolls.payrolls.length} record{myPayrolls.payrolls.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {myPayrolls.payrolls.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No payouts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your first payout will appear here once processed.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border/50">
            {myPayrolls.payrolls.map((p) => {
              const statusConfig = STATUS_CONFIG[p.status];
              const StatusIcon = statusConfig.icon;
              return (
                <div key={p._id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        ${p.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(p.periodStart + "T00:00:00"), "EEEE, MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", statusConfig.class)}>
                        <StatusIcon className={cn("w-3 h-3 mr-1", p.status === "pending_confirmation" ? "animate-spin" : "")} />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Earnings breakdown */}
                  {(p.status === "paid" || p.status === "pending_confirmation") && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Base: ${p.baseSalary}</span>
                      <span>Commission: ${p.commissionAmount.toLocaleString()}</span>
                      {p.walletAddress && (
                        <span className="font-mono truncate max-w-[150px]" title={p.walletAddress}>
                          {p.txNetwork === "btc" ? "BTC" : "TRC20"}: {p.walletAddress}
                        </span>
                      )}
                    </div>
                  )}

                  {p.status === "pending_confirmation" && p.txHash && p.txNetwork && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-amber-700 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Verifying on blockchain...
                      </span>
                      <a
                        href={getExplorerUrl(p.txHash, p.txNetwork)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        View TX <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {p.status === "paid" && p.confirmedAt && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Confirmed: {format(new Date(p.confirmedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {p.txHash && p.txNetwork && (
                        <div className="flex items-center gap-2">
                          <p className="font-mono truncate">TX: {p.txHash}</p>
                          <a
                            href={getExplorerUrl(p.txHash, p.txNetwork)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 shrink-0 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {p.txNetwork && (
                        <p>Network: {p.txNetwork === "btc" ? "Bitcoin" : "USDT (TRC20)"}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WalletSection({
  bitcoinAddress,
  usdtTrc20Address,
}: {
  bitcoinAddress: string;
  usdtTrc20Address: string;
}) {
  const updateProfile = useMutation(api.profile.updateMyProfile);
  const [btc, setBtc] = useState(bitcoinAddress);
  const [usdt, setUsdt] = useState(usdtTrc20Address);
  const [saving, setSaving] = useState(false);

  const hasChanges = btc !== bitcoinAddress || usdt !== usdtTrc20Address;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        bitcoinAddress: btc.trim(),
        usdtTrc20Address: usdt.trim(),
      });
      toast.success("Wallet addresses updated. Your admin will see the new addresses.");
    } catch {
      toast.error("Failed to update wallet addresses");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Receiving Wallets</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Update your wallet addresses below. Changes are visible to your admin immediately so they always send to the right address.
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="staff-btc" className="flex items-center gap-1.5 text-xs">
            <Bitcoin className="w-3.5 h-3.5 text-amber-600" />
            Bitcoin Address
          </Label>
          <Input
            id="staff-btc"
            value={btc}
            onChange={(e) => setBtc(e.target.value)}
            placeholder="Enter your Bitcoin address"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="staff-usdt" className="flex items-center gap-1.5 text-xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            USDT (TRC20) Address
          </Label>
          <Input
            id="staff-usdt"
            value={usdt}
            onChange={(e) => setUsdt(e.target.value)}
            placeholder="Enter your USDT TRC20 address"
            className="font-mono text-sm"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          size="sm"
          className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ArrowRight className="w-4 h-4 mr-1.5" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
