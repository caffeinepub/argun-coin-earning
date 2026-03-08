import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Coins,
  Copy,
  Link,
  Share2,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  useMyProfile,
  useMyReferrals,
  useMyTeamSize,
} from "../hooks/useQueries";

export default function ReferralPage() {
  const profileQuery = useMyProfile();
  const teamSizeQuery = useMyTeamSize();
  const referralsQuery = useMyReferrals();

  const profile =
    profileQuery.data && "ok" in profileQuery.data
      ? profileQuery.data.ok
      : null;
  const teamSize = teamSizeQuery.data ? Number(teamSizeQuery.data) : 0;
  const referrals = referralsQuery.data ?? [];

  const referralCode = profile?.referralCode ?? "";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join ARGUN Coin Earning",
          text: `Join me on ARGUN and earn coins daily! Use my referral code: ${referralCode}`,
          url: referralLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const teamTarget = 100;
  const teamProgress = Math.min((teamSize / teamTarget) * 100, 100);
  const isEligible = profile?.teamRewardEligible ?? false;

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
            background: "oklch(0.65 0.2 280 / 0.15)",
            border: "1px solid oklch(0.65 0.2 280 / 0.3)",
          }}
        >
          <Users className="w-5 h-5" style={{ color: "oklch(0.65 0.2 280)" }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Referral & Team
          </h1>
          <p className="text-muted-foreground text-xs">
            Earn 10 coins per referral · Refer to earn
          </p>
        </div>
      </motion.div>

      {/* Bonus Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 mb-4"
      >
        <div
          className="rounded-xl p-4"
          style={{
            background: "oklch(0.78 0.16 70 / 0.08)",
            border: "1px solid oklch(0.78 0.16 70 / 0.2)",
          }}
        >
          <Coins className="w-4 h-4 text-gold-mid mb-2" />
          <p className="font-display font-bold text-xl text-gold-bright">10</p>
          <p className="text-xs text-muted-foreground">coins you earn</p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{
            background: "oklch(0.65 0.2 280 / 0.08)",
            border: "1px solid oklch(0.65 0.2 280 / 0.2)",
          }}
        >
          <Coins
            className="w-4 h-4 mb-2"
            style={{ color: "oklch(0.65 0.2 280)" }}
          />
          <p
            className="font-display font-bold text-xl"
            style={{ color: "oklch(0.75 0.18 280)" }}
          >
            5
          </p>
          <p className="text-xs text-muted-foreground">bonus to friend</p>
        </div>
      </motion.div>

      {/* Referral Code */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-2xl p-5 mb-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Your Referral Code
        </p>
        {profileQuery.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <button
            type="button"
            data-ocid="referral.code_display"
            onClick={copyCode}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all active:scale-98"
            style={{
              background: "oklch(0.78 0.16 70 / 0.06)",
              border: "2px solid oklch(0.78 0.16 70 / 0.3)",
            }}
          >
            <span className="font-display font-black text-2xl gold-text tracking-widest">
              {referralCode || "—"}
            </span>
            <Copy className="w-4 h-4 text-gold-mid" />
          </button>
        )}
      </motion.div>

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 mb-4"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Referral Link
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div
              className="px-3 py-2.5 rounded-lg text-xs text-muted-foreground truncate"
              style={{
                background: "oklch(1 0 0 / 0.04)",
                border: "1px solid oklch(1 0 0 / 0.08)",
              }}
            >
              <Link className="w-3 h-3 inline mr-1.5 opacity-60" />
              {referralLink}
            </div>
          </div>
          <button
            type="button"
            data-ocid="referral.copy_button"
            onClick={copyLink}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background: "oklch(0.78 0.16 70 / 0.1)",
              border: "1px solid oklch(0.78 0.16 70 / 0.2)",
              color: "oklch(0.84 0.19 76)",
            }}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </button>
          <button
            type="button"
            onClick={shareLink}
            className="flex-shrink-0 p-2.5 rounded-lg transition-all active:scale-95"
            style={{
              background: "oklch(0.65 0.2 280 / 0.1)",
              border: "1px solid oklch(0.65 0.2 280 / 0.2)",
            }}
          >
            <Share2
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.18 280)" }}
            />
          </button>
        </div>
      </motion.div>

      {/* Team Progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy
              className={`w-4 h-4 ${isEligible ? "text-gold-bright" : "text-muted-foreground"}`}
            />
            <span className="text-sm font-medium">Team Progress</span>
          </div>
          {isEligible && (
            <Badge
              className="text-xs"
              style={{
                background: "oklch(0.78 0.16 70 / 0.15)",
                border: "1px solid oklch(0.78 0.16 70 / 0.3)",
                color: "oklch(0.84 0.19 76)",
              }}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Reward Eligible
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-display font-bold text-foreground">
            {teamSize}
            <span className="text-sm text-muted-foreground font-normal">
              {" "}
              / {teamTarget} members
            </span>
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(teamProgress)}%
          </span>
        </div>

        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: "oklch(1 0 0 / 0.08)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${teamProgress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full"
            style={{
              background: isEligible
                ? "linear-gradient(90deg, oklch(0.78 0.16 70), oklch(0.84 0.19 76))"
                : "linear-gradient(90deg, oklch(0.65 0.2 280), oklch(0.75 0.18 280))",
            }}
          />
        </div>

        {!isEligible && (
          <p className="text-xs text-muted-foreground mt-2">
            Build a team of {teamTarget} members to unlock the special salary
            reward
          </p>
        )}
        {isEligible && (
          <p className="text-xs text-gold-mid mt-2 font-medium">
            🎉 You qualify for the special team salary reward! Contact support.
          </p>
        )}
      </motion.div>

      {/* Referrals List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Your Referrals</h3>
          <span className="text-xs text-muted-foreground">
            {referrals.length} total
          </span>
        </div>

        {referralsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No referrals yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Share your code to earn 10 coins per referral
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((ref, i) => (
              <motion.div
                key={ref.id.toString()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-3 px-3 rounded-xl"
                style={{
                  background: "oklch(1 0 0 / 0.03)",
                  border: "1px solid oklch(1 0 0 / 0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "oklch(0.65 0.2 280 / 0.15)",
                      color: "oklch(0.75 0.18 280)",
                    }}
                  >
                    {ref.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {ref.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ref.coinBalance.toLocaleString()} coins
                    </p>
                  </div>
                </div>
                <Badge
                  className="text-xs"
                  style={{
                    background: "oklch(0.68 0.18 150 / 0.1)",
                    border: "1px solid oklch(0.68 0.18 150 / 0.2)",
                    color: "oklch(0.78 0.16 150)",
                  }}
                >
                  +10 coins
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
