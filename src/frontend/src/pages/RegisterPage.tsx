import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, LogOut, Mail, Phone, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterUser } from "../hooks/useQueries";

export default function RegisterPage() {
  const { clear } = useInternetIdentity();
  const registerMutation = useRegisterUser();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    referralCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error("Please provide at least email or phone number");
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        referralCode: form.referralCode.trim(),
      });

      if ("ok" in result) {
        toast.success("Account created successfully! Welcome to ARGUN 🎉");
      } else {
        toast.error(result.err);
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col px-5 py-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.16 70), transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="font-display font-black text-3xl gold-text">ARGUN</h1>
          <p className="text-muted-foreground text-xs">Create your account</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl p-6 relative z-10"
      >
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl text-foreground">
            Set up your profile
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Join ARGUN and start earning coins today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="register.username_input"
              placeholder="your_username"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              required
              className="h-12 bg-secondary/50 border-border focus:border-gold-mid/50 focus:ring-gold-mid/20 text-base"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email{" "}
              <span className="text-muted-foreground/50 text-xs">
                (optional if phone provided)
              </span>
            </Label>
            <Input
              data-ocid="register.email_input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="h-12 bg-secondary/50 border-border focus:border-gold-mid/50 focus:ring-gold-mid/20 text-base"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone{" "}
              <span className="text-muted-foreground/50 text-xs">
                (optional if email provided)
              </span>
            </Label>
            <Input
              data-ocid="register.phone_input"
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="h-12 bg-secondary/50 border-border focus:border-gold-mid/50 focus:ring-gold-mid/20 text-base"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Referral code */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-gold-mid" />
              Referral Code{" "}
              <span className="text-muted-foreground/50 text-xs">
                (optional)
              </span>
            </Label>
            <Input
              data-ocid="register.referral_input"
              placeholder="Enter referral code for 5 bonus coins"
              value={form.referralCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, referralCode: e.target.value }))
              }
              className="h-12 bg-secondary/50 border-border focus:border-gold-mid/50 focus:ring-gold-mid/20 text-base"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Bonus note */}
          {form.referralCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold-mid/5 gold-border"
            >
              <span className="text-gold-bright text-sm">🎁</span>
              <p className="text-gold-mid text-xs font-medium">
                You'll receive <strong>5 bonus coins</strong> on signup!
              </p>
            </motion.div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            data-ocid="register.submit_button"
            disabled={registerMutation.isPending}
            className="w-full h-14 text-base font-display font-bold rounded-xl mt-2"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
              color: "oklch(0.12 0.01 265)",
              boxShadow: "0 4px 20px oklch(0.74 0.16 68 / 0.35)",
            }}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account & Start Earning"
            )}
          </Button>
        </form>
      </motion.div>

      {/* Rate reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center text-muted-foreground text-xs relative z-10"
      >
        💡 Remember: <strong className="text-gold-mid">1 PKR = 1 Coin</strong>
      </motion.div>
    </div>
  );
}
