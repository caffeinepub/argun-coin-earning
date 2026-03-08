import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  Clock,
  Coins,
  LogOut,
  Play,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRoute } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useActiveAds,
  useClaimDailyProfit,
  useMyDailyProfit,
  useMyProfile,
  useWatchAd,
} from "../hooks/useQueries";

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { clear } = useInternetIdentity();
  const profileQuery = useMyProfile();
  const dailyProfitQuery = useMyDailyProfit();
  const adsQuery = useActiveAds();
  const watchAdMutation = useWatchAd();
  const claimMutation = useClaimDailyProfit();

  const [watchingAd, setWatchingAd] = useState<bigint | null>(null);
  const [watchingProgress, setWatchingProgress] = useState(0);
  const [watchingTitle, setWatchingTitle] = useState("");
  const [watchedLocalIds, setWatchedLocalIds] = useState<Set<string>>(
    new Set(),
  );

  const profile =
    profileQuery.data && "ok" in profileQuery.data
      ? profileQuery.data.ok
      : null;
  const dailyProfit = dailyProfitQuery.data ?? 0;
  const ads = adsQuery.data ?? [];

  const adsWatchedToday = profile ? Number(profile.adsWatchedToday) : 0;
  const adsNeeded = 5;
  const canClaim = adsWatchedToday >= adsNeeded;
  const planDay = profile ? Number(profile.planDay) : 0;

  const handleWatchAd = async (adId: bigint, title: string, index: number) => {
    if (watchedLocalIds.has(adId.toString())) return;
    if (index < adsWatchedToday) return;

    setWatchingAd(adId);
    setWatchingTitle(title);
    setWatchingProgress(0);

    // Simulate watching (3 seconds)
    const interval = setInterval(() => {
      setWatchingProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 10;
      });
    }, 300);

    setTimeout(async () => {
      clearInterval(interval);
      setWatchingProgress(100);
      setTimeout(async () => {
        try {
          const result = await watchAdMutation.mutateAsync(adId);
          if ("ok" in result) {
            setWatchedLocalIds((prev) => new Set([...prev, adId.toString()]));
            toast.success(`Ad watched! ${Number(result.ok) + 1}/5 completed`);
          } else {
            toast.error(result.err);
          }
        } catch {
          toast.error("Failed to record ad watch");
        } finally {
          setWatchingAd(null);
          setWatchingProgress(0);
        }
      }, 400);
    }, 3000);
  };

  const handleClaim = async () => {
    try {
      const result = await claimMutation.mutateAsync();
      if ("ok" in result) {
        toast.success(`🎉 Claimed ${result.ok.toFixed(3)} coins!`);
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to claim profit");
    }
  };

  const quickActions = [
    {
      label: "Deposit",
      icon: ArrowDownToLine,
      route: "deposit" as AppRoute,
      color: "oklch(0.68 0.18 150)",
    },
    {
      label: "Withdraw",
      icon: ArrowUpFromLine,
      route: "withdraw" as AppRoute,
      color: "oklch(0.65 0.22 25)",
    },
    {
      label: "Team",
      icon: Users,
      route: "referral" as AppRoute,
      color: "oklch(0.65 0.2 280)",
    },
    {
      label: "History",
      icon: Clock,
      route: "history" as AppRoute,
      color: "oklch(0.72 0.15 55)",
    },
  ];

  return (
    <div className="min-h-dvh px-4 pt-5 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-display font-black text-2xl gold-text tracking-tight">
            ARGUN
          </h1>
          {profile && (
            <p className="text-muted-foreground text-xs">
              Welcome,{" "}
              <span className="text-foreground/80">{profile.username}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </motion.header>

      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-6 mb-4 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.05 265), oklch(0.18 0.04 265))",
          border: "1px solid oklch(1 0 0 / 0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Decorative coin glow */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.16 70), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-gold-mid" />
            <span className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              Wallet Balance
            </span>
          </div>
          {profileQuery.isLoading ? (
            <Skeleton className="h-10 w-40 mt-2" />
          ) : (
            <div
              data-ocid="dashboard.wallet_balance"
              className="flex items-baseline gap-2"
            >
              <span className="font-display font-black text-4xl gold-text">
                {profile ? profile.coinBalance.toLocaleString() : "0"}
              </span>
              <span className="text-gold-mid/60 text-lg font-medium">
                coins
              </span>
            </div>
          )}
          <p className="text-muted-foreground text-xs mt-1">
            ≈ PKR {profile ? profile.coinBalance.toLocaleString() : "0"} · 1
            coin = 1 PKR
          </p>
        </div>
      </motion.div>

      {/* Daily Profit Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-foreground">
              Daily Profit
            </span>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
            Day {planDay}/50
          </span>
        </div>

        {dailyProfitQuery.isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div
            data-ocid="dashboard.daily_profit"
            className="flex items-baseline gap-1.5"
          >
            <span className="font-display font-bold text-2xl text-success">
              +{dailyProfit.toFixed(3)}
            </span>
            <span className="text-success/70 text-sm">coins/day</span>
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Plan progress</span>
            <span className="text-xs text-muted-foreground">
              {Math.round((planDay / 50) * 100)}%
            </span>
          </div>
          <Progress
            value={(planDay / 50) * 100}
            className="h-1.5"
            style={{
              background: "oklch(1 0 0 / 0.08)",
            }}
          />
        </div>
      </motion.div>

      {/* Ads Task Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-gold-mid" />
            <span className="text-sm font-medium">Watch Ads</span>
          </div>
          <span className="text-xs font-bold text-gold-bright">
            {adsWatchedToday}/{adsNeeded}
          </span>
        </div>

        {/* Ad slots */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {Array.from({ length: adsNeeded }, (_, i) => {
            const ad = ads[i];
            const isWatched = i < adsWatchedToday;
            const isCurrentlyWatching = ad && watchingAd === ad.id;
            const isNext = i === adsWatchedToday;

            const adKey = `ad-slot-${i}`;
            return (
              <button
                type="button"
                key={adKey}
                data-ocid={`dashboard.watch_ad_button.${i + 1}`}
                onClick={() =>
                  ad && isNext && !isCurrentlyWatching
                    ? handleWatchAd(ad.id, ad.title, i)
                    : undefined
                }
                disabled={
                  isWatched ||
                  !ad ||
                  !isNext ||
                  isCurrentlyWatching ||
                  watchAdMutation.isPending
                }
                className={`
                  relative flex flex-col items-center justify-center aspect-square rounded-xl transition-all duration-200
                  ${
                    isWatched
                      ? "bg-gold-mid/15 border border-gold-mid/30"
                      : isNext && ad
                        ? "bg-gold-mid/5 border border-gold-mid/20 hover:bg-gold-mid/10 active:scale-95 cursor-pointer"
                        : "bg-secondary/30 border border-border cursor-default"
                  }
                `}
              >
                {isWatched ? (
                  <CheckCircle className="w-5 h-5 text-gold-bright" />
                ) : isCurrentlyWatching ? (
                  <div className="w-5 h-5 rounded-full border-2 border-gold-mid border-t-transparent animate-spin" />
                ) : (
                  <Play
                    className={`w-4 h-4 ${isNext && ad ? "text-gold-mid" : "text-muted-foreground/40"}`}
                  />
                )}
                <span
                  className={`text-[9px] mt-1 font-medium ${isWatched ? "text-gold-mid" : "text-muted-foreground/50"}`}
                >
                  {isWatched ? "Done" : `Ad ${i + 1}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Claim button */}
        <Button
          onClick={handleClaim}
          disabled={!canClaim || claimMutation.isPending}
          data-ocid="dashboard.claim_button"
          className="w-full h-12 font-display font-bold rounded-xl transition-all duration-200"
          style={
            canClaim
              ? {
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
                  color: "oklch(0.12 0.01 265)",
                  boxShadow: "0 4px 20px oklch(0.74 0.16 68 / 0.4)",
                }
              : {}
          }
        >
          {claimMutation.isPending ? (
            <>
              <span className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
              Claiming...
            </>
          ) : canClaim ? (
            `🎉 Claim ${dailyProfit.toFixed(3)} Coins`
          ) : (
            `Watch ${adsNeeded - adsWatchedToday} more ads to claim`
          )}
        </Button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-3 mb-4"
      >
        {quickActions.map(({ label, icon: Icon, route, color }) => (
          <button
            type="button"
            key={route}
            onClick={() => onNavigate(route)}
            className="flex flex-col items-center gap-2 py-4 rounded-xl glass-card hover:bg-white/5 active:scale-95 transition-all duration-200"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}30`,
              }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Team reward badge */}
      {profile?.teamRewardEligible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-4 text-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.18 0.04 265))",
            border: "1px solid oklch(0.78 0.16 70 / 0.3)",
            boxShadow: "0 0 20px oklch(0.78 0.16 70 / 0.1)",
          }}
        >
          <p className="text-gold-bright font-display font-bold text-sm">
            🏆 Team Reward Eligible!
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            You've built a team of 100+ members. Contact support for your
            reward.
          </p>
        </motion.div>
      )}

      {/* Watching Ad Dialog */}
      <AnimatePresence>
        {watchingAd !== null && (
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent
              className="max-w-xs mx-auto rounded-2xl"
              style={{
                background: "oklch(0.18 0.03 265)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-center font-display">
                  Watching Ad
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  {watchingTitle || "Ad content loading..."}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center relative"
                  style={{
                    background:
                      "radial-gradient(circle, oklch(0.78 0.16 70 / 0.2), transparent)",
                    border: "2px solid oklch(0.78 0.16 70 / 0.3)",
                  }}
                >
                  <Play className="w-8 h-8 text-gold-mid" />
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="oklch(0.78 0.16 70)"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 46}`}
                      strokeDashoffset={`${2 * Math.PI * 46 * (1 - watchingProgress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  {watchingProgress < 100
                    ? "Please watch the full ad..."
                    : "Ad completed! ✓"}
                </p>
                <Progress value={watchingProgress} className="w-full h-2" />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
