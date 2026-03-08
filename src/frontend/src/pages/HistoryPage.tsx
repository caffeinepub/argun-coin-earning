import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine, Clock } from "lucide-react";
import { motion } from "motion/react";
import {
  formatTimestamp,
  getDepositStatusLabel,
  getPaymentMethodLabel,
  getWithdrawalStatusLabel,
  useMyDeposits,
  useMyWithdrawals,
} from "../hooks/useQueries";

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Pending: {
      bg: "oklch(0.72 0.15 55 / 0.1)",
      border: "oklch(0.72 0.15 55 / 0.3)",
      color: "oklch(0.82 0.14 60)",
    },
    Approved: {
      bg: "oklch(0.68 0.18 150 / 0.1)",
      border: "oklch(0.68 0.18 150 / 0.3)",
      color: "oklch(0.78 0.16 150)",
    },
    Rejected: {
      bg: "oklch(0.65 0.22 25 / 0.1)",
      border: "oklch(0.65 0.22 25 / 0.3)",
      color: "oklch(0.75 0.2 25)",
    },
  }[status] ?? {
    bg: "oklch(1 0 0 / 0.05)",
    border: "oklch(1 0 0 / 0.1)",
    color: "oklch(0.7 0 0)",
  };

  return (
    <Badge
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
      }}
      className="text-xs font-medium px-2 py-0.5"
    >
      {status}
    </Badge>
  );
}

export default function HistoryPage() {
  const depositsQuery = useMyDeposits();
  const withdrawalsQuery = useMyWithdrawals();

  const deposits = depositsQuery.data ?? [];
  const withdrawals = withdrawalsQuery.data ?? [];

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
            background: "oklch(0.72 0.15 55 / 0.15)",
            border: "1px solid oklch(0.72 0.15 55 / 0.3)",
          }}
        >
          <Clock className="w-5 h-5" style={{ color: "oklch(0.82 0.14 60)" }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            History
          </h1>
          <p className="text-muted-foreground text-xs">
            Deposits & Withdrawals
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Tabs defaultValue="deposits">
          <TabsList
            className="w-full h-11 rounded-xl mb-4"
            style={{
              background: "oklch(0.18 0.025 265)",
              border: "1px solid oklch(1 0 0 / 0.08)",
            }}
          >
            <TabsTrigger
              value="deposits"
              className={cn(
                "flex-1 rounded-lg flex items-center gap-1.5 text-sm font-medium",
                "data-[state=active]:shadow-none",
              )}
              style={
                {
                  // active styles via data attribute handled by shadcn
                }
              }
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Deposits ({deposits.length})
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="flex-1 rounded-lg flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Withdrawals ({withdrawals.length})
            </TabsTrigger>
          </TabsList>

          {/* Deposits Tab */}
          <TabsContent value="deposits" className="mt-0 space-y-3">
            {depositsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : deposits.length === 0 ? (
              <div
                data-ocid="history.empty_state"
                className="text-center py-12"
              >
                <ArrowDownToLine className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No deposits yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Make your first deposit to start earning
                </p>
              </div>
            ) : (
              deposits.map((deposit, i) => {
                const statusLabel = getDepositStatusLabel(deposit.status);
                const methodLabel = getPaymentMethodLabel(deposit.method);
                return (
                  <motion.div
                    key={deposit.id.toString()}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-xl p-4"
                    data-ocid={`history.deposits.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "oklch(0.68 0.18 150 / 0.1)",
                            border: "1px solid oklch(0.68 0.18 150 / 0.2)",
                          }}
                        >
                          <ArrowDownToLine className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {deposit.amount.toLocaleString()} PKR
                            </span>
                            <StatusBadge status={statusLabel} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {methodLabel} · {formatTimestamp(deposit.createdAt)}
                          </p>
                          {deposit.note && (
                            <p className="text-xs text-muted-foreground/60 mt-1 italic">
                              Note: {deposit.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          #{deposit.id.toString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="mt-0 space-y-3">
            {withdrawalsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <ArrowUpFromLine className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No withdrawals yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Earn coins and withdraw to your account
                </p>
              </div>
            ) : (
              withdrawals.map((withdrawal, i) => {
                const statusLabel = getWithdrawalStatusLabel(withdrawal.status);
                const methodLabel = getPaymentMethodLabel(withdrawal.method);
                return (
                  <motion.div
                    key={withdrawal.id.toString()}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-xl p-4"
                    data-ocid={`history.withdrawals.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "oklch(0.65 0.22 25 / 0.1)",
                            border: "1px solid oklch(0.65 0.22 25 / 0.2)",
                          }}
                        >
                          <ArrowUpFromLine className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {withdrawal.amount.toLocaleString()} coins
                            </span>
                            <StatusBadge status={statusLabel} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {methodLabel} ·{" "}
                            {formatTimestamp(withdrawal.createdAt)}
                          </p>
                          <p className="text-xs text-success mt-0.5 font-medium">
                            Net: {withdrawal.netAmount.toFixed(2)} PKR
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          #{withdrawal.id.toString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
