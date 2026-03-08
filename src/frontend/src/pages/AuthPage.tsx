import { Button } from "@/components/ui/button";
import { Loader2, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthPage() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-5 py-8 overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-10%] right-[-20%] w-[60vw] h-[60vw] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.16 70), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[10%] left-[-20%] w-[50vw] h-[50vw] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.2 280), transparent 70%)",
          }}
        />
      </div>

      {/* Top spacer */}
      <div />

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 w-full max-w-sm relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center gap-3"
        >
          {/* Coin icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full coin-shimmer flex items-center justify-center shadow-gold animate-float">
              <span className="font-display font-black text-4xl text-amber-900 select-none">
                ₳
              </span>
            </div>
            <div
              className="absolute -inset-2 rounded-full opacity-30 animate-coin-pulse"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.16 70), transparent 70%)",
              }}
            />
          </div>

          {/* App name */}
          <div className="text-center">
            <h1 className="font-display font-black text-5xl tracking-tight gold-text">
              ARGUN
            </h1>
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase mt-1">
              Coin Earning Platform
            </p>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-3"
        >
          {[
            { icon: TrendingUp, text: "Earn daily coins with profit plans" },
            { icon: Zap, text: "Watch ads to unlock daily earnings" },
            { icon: Shield, text: "Secure Internet Identity login" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 glass-card rounded-xl px-4 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gold-mid/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gold-mid" />
              </div>
              <p className="text-sm text-foreground/80">{text}</p>
            </div>
          ))}
        </motion.div>

        {/* Rate info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full gold-border bg-gold-mid/5"
        >
          <span className="text-gold-bright font-bold text-lg">1 PKR</span>
          <span className="text-muted-foreground text-sm">=</span>
          <span className="text-gold-bright font-bold text-lg">1 Coin</span>
          <span className="text-lg">🪙</span>
        </motion.div>

        {/* Login button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full"
        >
          <Button
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="auth.login_button"
            className="w-full h-14 text-base font-display font-bold tracking-wide rounded-2xl transition-all duration-200 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.16 70), oklch(0.6 0.14 64))",
              color: "oklch(0.12 0.01 265)",
              boxShadow:
                "0 4px 24px oklch(0.74 0.16 68 / 0.4), 0 1px 4px oklch(0.74 0.16 68 / 0.2)",
            }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Login with Internet Identity
              </>
            )}
          </Button>

          {isLoginError && (
            <p className="text-destructive text-sm text-center mt-3">
              {loginError?.message ?? "Login failed. Please try again."}
            </p>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center relative z-10"
      >
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-mid hover:text-gold-bright transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.footer>
    </div>
  );
}
