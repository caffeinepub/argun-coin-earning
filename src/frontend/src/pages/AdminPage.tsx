import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  Coins,
  ExternalLink,
  Eye,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  formatTimestamp,
  getPaymentMethodLabel,
  useAdminAddAd,
  useAdminAdjustCoins,
  useAdminAllAds,
  useAdminAllUsers,
  useAdminApproveDeposit,
  useAdminApproveWithdrawal,
  useAdminPendingDeposits,
  useAdminPendingWithdrawals,
  useAdminRejectDeposit,
  useAdminRejectWithdrawal,
  useAdminRemoveAd,
  useAdminStats,
  useAdminToggleAd,
} from "../hooks/useQueries";
import { useStorageClient } from "../hooks/useStorageClient";

interface DepositDialogState {
  open: boolean;
  depositId: bigint | null;
  action: "approve" | "reject" | null;
  screenshotUrl?: string;
}

interface AdjustCoinsDialogState {
  open: boolean;
  userId: Principal | null;
  username: string;
}

export default function AdminPage() {
  const statsQuery = useAdminStats();
  const pendingDepositsQuery = useAdminPendingDeposits();
  const allUsersQuery = useAdminAllUsers();
  const pendingWithdrawalsQuery = useAdminPendingWithdrawals();
  const allAdsQuery = useAdminAllAds();

  const { createStorageClient } = useStorageClient();
  const approveDeposit = useAdminApproveDeposit();
  const rejectDeposit = useAdminRejectDeposit();
  const adjustCoins = useAdminAdjustCoins();
  const approveWithdrawal = useAdminApproveWithdrawal();
  const rejectWithdrawal = useAdminRejectWithdrawal();
  const addAd = useAdminAddAd();
  const toggleAd = useAdminToggleAd();
  const removeAd = useAdminRemoveAd();

  const [depositDialog, setDepositDialog] = useState<DepositDialogState>({
    open: false,
    depositId: null,
    action: null,
  });
  const [depositNote, setDepositNote] = useState("");
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);

  const [adjustDialog, setAdjustDialog] = useState<AdjustCoinsDialogState>({
    open: false,
    userId: null,
    username: "",
  });
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const [newAdTitle, setNewAdTitle] = useState("");
  const [newAdUrl, setNewAdUrl] = useState("");

  const stats = statsQuery.data;
  const pendingDeposits = pendingDepositsQuery.data ?? [];
  const allUsers = allUsersQuery.data ?? [];
  const pendingWithdrawals = pendingWithdrawalsQuery.data ?? [];
  const allAds = allAdsQuery.data ?? [];

  const openDepositDialog = async (
    depositId: bigint,
    action: "approve" | "reject",
    screenshotHash: string,
  ) => {
    setLoadingScreenshot(true);
    let url = "";
    try {
      if (screenshotHash) {
        const client = await createStorageClient("deposits");
        if (client) {
          url = await client.getDirectURL(screenshotHash);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingScreenshot(false);
    }
    setDepositNote("");
    setDepositDialog({ open: true, depositId, action, screenshotUrl: url });
  };

  const handleDepositAction = async () => {
    if (!depositDialog.depositId || !depositDialog.action) return;
    try {
      if (depositDialog.action === "approve") {
        const res = await approveDeposit.mutateAsync({
          depositId: depositDialog.depositId,
          note: depositNote,
        });
        if ("ok" in res) {
          toast.success("Deposit approved!");
        } else {
          toast.error(res.err);
        }
      } else {
        const res = await rejectDeposit.mutateAsync({
          depositId: depositDialog.depositId,
          note: depositNote,
        });
        if ("ok" in res) {
          toast.success("Deposit rejected");
        } else {
          toast.error(res.err);
        }
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setDepositDialog({ open: false, depositId: null, action: null });
    }
  };

  const handleAdjustCoins = async () => {
    if (!adjustDialog.userId) return;
    const delta = Number.parseFloat(adjustDelta);
    if (Number.isNaN(delta)) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      const res = await adjustCoins.mutateAsync({
        userId: adjustDialog.userId,
        delta,
        reason: adjustReason,
      });
      if ("ok" in res) {
        toast.success(`Adjusted ${delta} coins for ${adjustDialog.username}`);
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Adjustment failed");
    } finally {
      setAdjustDialog({ open: false, userId: null, username: "" });
      setAdjustDelta("");
      setAdjustReason("");
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdUrl.trim()) {
      toast.error("Title and URL required");
      return;
    }
    try {
      await addAd.mutateAsync({
        title: newAdTitle.trim(),
        url: newAdUrl.trim(),
      });
      toast.success("Ad added!");
      setNewAdTitle("");
      setNewAdUrl("");
    } catch {
      toast.error("Failed to add ad");
    }
  };

  const handleToggleAd = async (adId: bigint) => {
    try {
      const res = await toggleAd.mutateAsync(adId);
      if ("ok" in res) {
        toast.success("Ad toggled");
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Toggle failed");
    }
  };

  const handleRemoveAd = async (adId: bigint) => {
    try {
      const res = await removeAd.mutateAsync(adId);
      if ("ok" in res) {
        toast.success("Ad removed");
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Remove failed");
    }
  };

  const handleWithdrawalAction = async (
    withdrawalId: bigint,
    action: "approve" | "reject",
  ) => {
    try {
      if (action === "approve") {
        const res = await approveWithdrawal.mutateAsync(withdrawalId);
        if ("ok" in res) toast.success("Withdrawal approved!");
        else toast.error(res.err);
      } else {
        const res = await rejectWithdrawal.mutateAsync(withdrawalId);
        if ("ok" in res) toast.success("Withdrawal rejected");
        else toast.error(res.err);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const statItems = [
    {
      label: "Total Users",
      value: stats?.totalUsers?.toString() ?? "—",
      icon: Users,
      color: "oklch(0.65 0.2 280)",
    },
    {
      label: "Total Deposits",
      value: stats?.totalDeposits?.toString() ?? "—",
      icon: ArrowDownToLine,
      color: "oklch(0.68 0.18 150)",
    },
    {
      label: "Pending Deposits",
      value: stats?.pendingDeposits?.toString() ?? "—",
      icon: TrendingUp,
      color: "oklch(0.72 0.15 55)",
    },
    {
      label: "Pending Withdrawals",
      value: stats?.pendingWithdrawals?.toString() ?? "—",
      icon: Activity,
      color: "oklch(0.65 0.22 25)",
    },
  ];

  return (
    <div className="min-h-dvh px-4 pt-5 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "oklch(0.78 0.16 70 / 0.15)",
            border: "1px solid oklch(0.78 0.16 70 / 0.3)",
          }}
        >
          <Shield className="w-5 h-5 text-gold-mid" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-xs">Manage ARGUN platform</p>
        </div>
        <button
          type="button"
          onClick={() => {
            statsQuery.refetch();
            pendingDepositsQuery.refetch();
          }}
          className="ml-auto p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 mb-5"
      >
        {statItems.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{
              background: `${color.replace(")", " / 0.08)")}`,
              border: `1px solid ${color.replace(")", " / 0.2)")}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            {statsQuery.isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="font-display font-bold text-xl text-foreground">
                {value}
              </p>
            )}
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="deposits">
          <TabsList
            className="w-full h-11 rounded-xl mb-4 grid grid-cols-4"
            style={{
              background: "oklch(0.18 0.025 265)",
              border: "1px solid oklch(1 0 0 / 0.08)",
            }}
          >
            <TabsTrigger
              value="deposits"
              data-ocid="admin.deposits_tab"
              className="rounded-lg text-xs font-medium"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
              Deposits
              {pendingDeposits.length > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: "oklch(0.72 0.15 55 / 0.3)",
                    color: "oklch(0.82 0.14 60)",
                  }}
                >
                  {pendingDeposits.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-ocid="admin.users_tab"
              className="rounded-lg text-xs font-medium"
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              data-ocid="admin.withdrawals_tab"
              className="rounded-lg text-xs font-medium"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5 mr-1" />
              Withdraw
            </TabsTrigger>
            <TabsTrigger
              value="ads"
              data-ocid="admin.ads_tab"
              className="rounded-lg text-xs font-medium"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Ads
            </TabsTrigger>
          </TabsList>

          {/* === DEPOSITS TAB === */}
          <TabsContent value="deposits" className="mt-0 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              {pendingDeposits.length} pending deposits
            </p>
            {pendingDepositsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingDeposits.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-8 h-8 text-success/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending deposits
                </p>
              </div>
            ) : (
              pendingDeposits.map((deposit, i) => (
                <motion.div
                  key={deposit.id.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">
                          {deposit.amount.toLocaleString()} PKR
                        </span>
                        <Badge
                          className="text-xs"
                          style={{
                            background: "oklch(0.72 0.15 55 / 0.1)",
                            border: "1px solid oklch(0.72 0.15 55 / 0.3)",
                            color: "oklch(0.82 0.14 60)",
                          }}
                        >
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getPaymentMethodLabel(deposit.method)} ·{" "}
                        {formatTimestamp(deposit.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                        User: {deposit.userId.toString().slice(0, 20)}...
                      </p>
                    </div>
                    {deposit.screenshotHash && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const client =
                              await createStorageClient("deposits");
                            if (client) {
                              const url = await client.getDirectURL(
                                deposit.screenshotHash,
                              );
                              window.open(url, "_blank");
                            }
                          } catch {
                            toast.error("Could not open screenshot");
                          }
                        }}
                        className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      data-ocid={`admin.approve_button.${i + 1}`}
                      onClick={() =>
                        openDepositDialog(
                          deposit.id,
                          "approve",
                          deposit.screenshotHash,
                        )
                      }
                      disabled={
                        approveDeposit.isPending || rejectDeposit.isPending
                      }
                      className="flex-1 h-9 text-xs font-medium rounded-lg"
                      style={{
                        background: "oklch(0.68 0.18 150 / 0.15)",
                        border: "1px solid oklch(0.68 0.18 150 / 0.3)",
                        color: "oklch(0.78 0.16 150)",
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid={`admin.reject_button.${i + 1}`}
                      onClick={() =>
                        openDepositDialog(
                          deposit.id,
                          "reject",
                          deposit.screenshotHash,
                        )
                      }
                      disabled={
                        approveDeposit.isPending || rejectDeposit.isPending
                      }
                      className="flex-1 h-9 text-xs font-medium rounded-lg"
                      style={{
                        background: "oklch(0.65 0.22 25 / 0.1)",
                        border: "1px solid oklch(0.65 0.22 25 / 0.2)",
                        color: "oklch(0.75 0.2 25)",
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* === USERS TAB === */}
          <TabsContent value="users" className="mt-0 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              {allUsers.length} total users
            </p>
            {allUsersQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No users yet</p>
              </div>
            ) : (
              allUsers.map((user, i) => (
                <motion.div
                  key={user.id.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-xl p-4"
                  data-ocid={`admin.users.item.${i + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: "oklch(0.65 0.2 280 / 0.15)",
                          color: "oklch(0.75 0.18 280)",
                        }}
                      >
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.username}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-3 h-3 text-gold-mid" />
                          <p className="text-xs text-gold-mid font-medium">
                            {user.coinBalance.toLocaleString()} coins
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        setAdjustDialog({
                          open: true,
                          userId: user.id,
                          username: user.username,
                        })
                      }
                      className="h-8 text-xs font-medium rounded-lg flex-shrink-0"
                      style={{
                        background: "oklch(0.78 0.16 70 / 0.1)",
                        border: "1px solid oklch(0.78 0.16 70 / 0.2)",
                        color: "oklch(0.84 0.19 76)",
                      }}
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      Adjust
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* === WITHDRAWALS TAB === */}
          <TabsContent value="withdrawals" className="mt-0 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              {pendingWithdrawals.length} pending withdrawals
            </p>
            {pendingWithdrawalsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingWithdrawals.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-8 h-8 text-success/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending withdrawals
                </p>
              </div>
            ) : (
              pendingWithdrawals.map((wd, i) => (
                <motion.div
                  key={wd.id.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-foreground">
                        {wd.amount.toLocaleString()} coins
                      </span>
                      <Badge
                        className="text-xs"
                        style={{
                          background: "oklch(0.72 0.15 55 / 0.1)",
                          border: "1px solid oklch(0.72 0.15 55 / 0.3)",
                          color: "oklch(0.82 0.14 60)",
                        }}
                      >
                        Pending
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getPaymentMethodLabel(wd.method)} ·{" "}
                      {formatTimestamp(wd.createdAt)}
                    </p>
                    <p className="text-xs text-success mt-0.5">
                      Net: {wd.netAmount.toFixed(2)} PKR → {wd.accountNumber}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleWithdrawalAction(wd.id, "approve")}
                      disabled={
                        approveWithdrawal.isPending ||
                        rejectWithdrawal.isPending
                      }
                      className="flex-1 h-9 text-xs font-medium rounded-lg"
                      style={{
                        background: "oklch(0.68 0.18 150 / 0.15)",
                        border: "1px solid oklch(0.68 0.18 150 / 0.3)",
                        color: "oklch(0.78 0.16 150)",
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleWithdrawalAction(wd.id, "reject")}
                      disabled={
                        approveWithdrawal.isPending ||
                        rejectWithdrawal.isPending
                      }
                      className="flex-1 h-9 text-xs font-medium rounded-lg"
                      style={{
                        background: "oklch(0.65 0.22 25 / 0.1)",
                        border: "1px solid oklch(0.65 0.22 25 / 0.2)",
                        color: "oklch(0.75 0.2 25)",
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* === ADS TAB === */}
          <TabsContent value="ads" className="mt-0 space-y-4">
            {/* Add new ad form */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold-mid" />
                Add New Ad
              </h3>
              <form onSubmit={handleAddAd} className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Ad Title
                  </Label>
                  <Input
                    data-ocid="admin.ad_title_input"
                    value={newAdTitle}
                    onChange={(e) => setNewAdTitle(e.target.value)}
                    placeholder="e.g. Product Banner Ad"
                    className="h-10 mt-1 bg-secondary/50 border-border text-sm"
                    style={{ fontSize: "16px" }}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Ad URL
                  </Label>
                  <Input
                    data-ocid="admin.ad_url_input"
                    value={newAdUrl}
                    onChange={(e) => setNewAdUrl(e.target.value)}
                    placeholder="https://example.com/ad"
                    type="url"
                    className="h-10 mt-1 bg-secondary/50 border-border text-sm"
                    style={{ fontSize: "16px" }}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  data-ocid="admin.add_ad_button"
                  disabled={addAd.isPending}
                  size="sm"
                  className="w-full h-10 text-sm font-medium rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
                    color: "oklch(0.12 0.01 265)",
                  }}
                >
                  {addAd.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Ad
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Ads list */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {allAds.length} total ads
              </p>
              {allAdsQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : allAds.length === 0 ? (
                <div className="text-center py-8">
                  <Play className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No ads yet</p>
                </div>
              ) : (
                allAds.map((ad, i) => (
                  <motion.div
                    key={ad.id.toString()}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card rounded-xl p-4 flex items-center justify-between gap-3"
                    data-ocid={`admin.ads.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: ad.active
                            ? "oklch(0.68 0.18 150 / 0.1)"
                            : "oklch(1 0 0 / 0.05)",
                          border: `1px solid ${ad.active ? "oklch(0.68 0.18 150 / 0.3)" : "oklch(1 0 0 / 0.1)"}`,
                        }}
                      >
                        <Play
                          className="w-3.5 h-3.5"
                          style={{
                            color: ad.active
                              ? "oklch(0.68 0.18 150)"
                              : "oklch(0.5 0 0)",
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ad.title}
                        </p>
                        <a
                          href={ad.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground/60 hover:text-gold-mid transition-colors flex items-center gap-1 truncate"
                        >
                          {ad.url.slice(0, 30)}...
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAd(ad.id)}
                        disabled={toggleAd.isPending}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{
                          color: ad.active
                            ? "oklch(0.68 0.18 150)"
                            : "oklch(0.5 0 0)",
                        }}
                        title={ad.active ? "Deactivate" : "Activate"}
                      >
                        {ad.active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAd(ad.id)}
                        disabled={removeAd.isPending}
                        className="p-1.5 rounded-lg transition-colors text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Deposit Action Dialog */}
      <Dialog
        open={depositDialog.open}
        onOpenChange={(open) => setDepositDialog((d) => ({ ...d, open }))}
      >
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.18 0.03 265)",
            border: "1px solid oklch(1 0 0 / 0.1)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {depositDialog.action === "approve" ? "Approve" : "Reject"}{" "}
              Deposit
            </DialogTitle>
          </DialogHeader>

          {loadingScreenshot ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : depositDialog.screenshotUrl ? (
            <div className="rounded-xl overflow-hidden">
              <img
                src={depositDialog.screenshotUrl}
                alt="Payment screenshot"
                className="w-full max-h-48 object-contain bg-black/20"
              />
              <a
                href={depositDialog.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gold-mid mt-2 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View full screenshot
              </a>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Note (optional)
            </Label>
            <Input
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              placeholder="Add a note for the user..."
              className="bg-secondary/50 border-border text-sm"
              style={{ fontSize: "16px" }}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              data-ocid="admin.deposit_dialog.cancel_button"
              onClick={() =>
                setDepositDialog({ open: false, depositId: null, action: null })
              }
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid={`admin.deposit_dialog.${depositDialog.action}_button`}
              onClick={handleDepositAction}
              disabled={approveDeposit.isPending || rejectDeposit.isPending}
              className="flex-1"
              style={
                depositDialog.action === "approve"
                  ? {
                      background: "oklch(0.68 0.18 150 / 0.2)",
                      border: "1px solid oklch(0.68 0.18 150 / 0.4)",
                      color: "oklch(0.78 0.16 150)",
                    }
                  : {
                      background: "oklch(0.65 0.22 25 / 0.2)",
                      border: "1px solid oklch(0.65 0.22 25 / 0.4)",
                      color: "oklch(0.75 0.2 25)",
                    }
              }
            >
              {approveDeposit.isPending || rejectDeposit.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : depositDialog.action === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Coins Dialog */}
      <Dialog
        open={adjustDialog.open}
        onOpenChange={(open) => setAdjustDialog((d) => ({ ...d, open }))}
      >
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.18 0.03 265)",
            border: "1px solid oklch(1 0 0 / 0.1)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display">Adjust Coins</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Adjusting coins for{" "}
            <strong className="text-foreground">{adjustDialog.username}</strong>
          </p>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                Amount (positive to add, negative to remove)
              </Label>
              <Input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="mt-1 bg-secondary/50 border-border"
                style={{ fontSize: "16px" }}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Reason</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Bonus for promotion"
                className="mt-1 bg-secondary/50 border-border"
                style={{ fontSize: "16px" }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              data-ocid="admin.adjust_dialog.cancel_button"
              onClick={() =>
                setAdjustDialog({ open: false, userId: null, username: "" })
              }
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.adjust_dialog.confirm_button"
              onClick={handleAdjustCoins}
              disabled={adjustCoins.isPending || !adjustDelta}
              className="flex-1"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
                color: "oklch(0.12 0.01 265)",
              }}
            >
              {adjustCoins.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
