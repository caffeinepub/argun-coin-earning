import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowUpFromLine,
  Coins,
  Info,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useMyProfile, useSubmitWithdrawal } from "../hooks/useQueries";
import type { PaymentMethod } from "../hooks/useQueries";

const WITHDRAWAL_FEE = 0.1; // 10%
const MIN_WITHDRAWAL = 100;

export default function WithdrawPage() {
  const profileQuery = useMyProfile();
  const submitWithdrawal = useSubmitWithdrawal();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState("");

  const profile =
    profileQuery.data && "ok" in profileQuery.data
      ? profileQuery.data.ok
      : null;
  const balance = profile?.coinBalance ?? 0;

  const amountNum = Number.parseFloat(amount) || 0;
  const fee = amountNum * WITHDRAWAL_FEE;
  const netAmount = amountNum - fee;

  const isValid =
    amountNum >= MIN_WITHDRAWAL &&
    amountNum <= balance &&
    method !== "" &&
    accountNumber.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amountNum < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL} coins`);
      return;
    }
    if (amountNum > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!method) {
      toast.error("Please select a withdrawal method");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter your account number");
      return;
    }

    const paymentMethod: PaymentMethod =
      method === "Easypaisa" ? { Easypaisa: null } : { JazzCash: null };

    try {
      const result = await submitWithdrawal.mutateAsync({
        amount: amountNum,
        method: paymentMethod,
        accountNumber: accountNumber.trim(),
      });

      if ("ok" in result) {
        toast.success(
          "Withdrawal request submitted! Processing within 24-48 hours.",
        );
        setAmount("");
        setMethod("");
        setAccountNumber("");
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Failed to submit withdrawal. Please try again.");
    }
  };

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
            background: "oklch(0.65 0.22 25 / 0.15)",
            border: "1px solid oklch(0.65 0.22 25 / 0.3)",
          }}
        >
          <ArrowUpFromLine className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">
            Withdraw
          </h1>
          <p className="text-muted-foreground text-xs">
            10% fee · Easypaisa & JazzCash
          </p>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 mb-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.05 265), oklch(0.18 0.04 265))",
          border: "1px solid oklch(1 0 0 / 0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full coin-shimmer flex items-center justify-center">
            <Coins className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Available Balance</p>
            <p className="font-display font-bold text-xl gold-text">
              {balance.toLocaleString()}{" "}
              <span className="text-sm font-normal text-gold-mid/60">
                coins
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">≈ PKR</p>
          <p className="text-sm font-bold text-foreground/80">
            {balance.toLocaleString()}
          </p>
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Amount */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Withdrawal Amount (Coins)
          </Label>
          <div className="relative">
            <Input
              data-ocid="withdraw.amount_input"
              type="number"
              min={MIN_WITHDRAWAL}
              max={balance}
              step="1"
              placeholder={`Min ${MIN_WITHDRAWAL} coins`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 text-xl font-display font-bold bg-secondary/50 border-border focus:border-gold-mid/50 pr-20"
              style={{ fontSize: "18px" }}
              required
            />
            <button
              type="button"
              onClick={() => setAmount(balance.toString())}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold-mid font-bold bg-gold-mid/10 px-2 py-1 rounded-md hover:bg-gold-mid/20 transition-colors"
            >
              MAX
            </button>
          </div>

          {amountNum > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Withdrawal amount</span>
                <span className="font-medium">
                  {amountNum.toLocaleString()} coins
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee (10%)</span>
                <span className="text-destructive">
                  -{fee.toFixed(2)} coins
                </span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  You receive
                </span>
                <span className="font-display font-bold text-lg text-success">
                  {netAmount.toFixed(2)} PKR
                </span>
              </div>
            </motion.div>
          )}

          {amountNum > 0 && amountNum < MIN_WITHDRAWAL && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Minimum withdrawal is {MIN_WITHDRAWAL} coins
            </p>
          )}
          {amountNum > balance && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Exceeds your balance
            </p>
          )}
        </div>

        {/* Method */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Withdrawal Method
          </Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger
              data-ocid="withdraw.method_select"
              className="h-12 bg-secondary/50 border-border text-base"
            >
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent
              className="rounded-xl"
              style={{
                background: "oklch(0.18 0.03 265)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <SelectItem value="Easypaisa" className="text-base py-3">
                📱 Easypaisa
              </SelectItem>
              <SelectItem value="JazzCash" className="text-base py-3">
                💚 JazzCash
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account Number */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            {method === "JazzCash"
              ? "JazzCash"
              : method === "Easypaisa"
                ? "Easypaisa"
                : "Account"}{" "}
            Number
          </Label>
          <Input
            data-ocid="withdraw.account_input"
            type="tel"
            placeholder="03XX-XXXXXXX"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="h-12 bg-secondary/50 border-border focus:border-gold-mid/50 text-base"
            style={{ fontSize: "16px" }}
            required
          />
        </div>

        {/* Info note */}
        <div
          className="flex items-start gap-2.5 rounded-xl p-3"
          style={{
            background: "oklch(0.78 0.16 70 / 0.06)",
            border: "1px solid oklch(0.78 0.16 70 / 0.15)",
          }}
        >
          <Info className="w-4 h-4 text-gold-mid mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Withdrawals are processed within{" "}
            <strong className="text-foreground">24–48 hours</strong>. A 10%
            service fee applies. Ensure your account number is correct.
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          data-ocid="withdraw.submit_button"
          disabled={!isValid || submitWithdrawal.isPending}
          className="w-full h-14 text-base font-display font-bold rounded-xl"
          style={
            isValid
              ? {
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
                  color: "oklch(0.12 0.01 265)",
                  boxShadow: "0 4px 20px oklch(0.74 0.16 68 / 0.35)",
                }
              : {}
          }
        >
          {submitWithdrawal.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            `Withdraw ${netAmount > 0 ? `${netAmount.toFixed(2)} PKR` : ""}`
          )}
        </Button>
      </motion.form>
    </div>
  );
}
