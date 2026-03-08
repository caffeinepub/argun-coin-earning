import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import BottomNav from "./components/BottomNav";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerRole, useMyProfile } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import DepositPage from "./pages/DepositPage";
import HistoryPage from "./pages/HistoryPage";
import ReferralPage from "./pages/ReferralPage";
import RegisterPage from "./pages/RegisterPage";
import WithdrawPage from "./pages/WithdrawPage";

export type AppRoute =
  | "dashboard"
  | "deposit"
  | "withdraw"
  | "referral"
  | "history"
  | "admin";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const profileQuery = useMyProfile();
  const roleQuery = useCallerRole();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("dashboard");

  const isLoading = isInitializing || actorFetching || profileQuery.isLoading;

  if (isLoading && identity) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full coin-shimmer animate-coin-pulse flex items-center justify-center shadow-gold">
            <span className="text-2xl font-bold text-amber-900">₳</span>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading ARGUN...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in — show auth page
  if (!identity) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  // Logged in but profile not loaded yet
  if (profileQuery.isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full coin-shimmer animate-coin-pulse flex items-center justify-center shadow-gold">
            <span className="text-2xl font-bold text-amber-900">₳</span>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading ARGUN...
          </p>
        </div>
      </div>
    );
  }

  // No profile — show registration
  if (!profileQuery.data || "err" in profileQuery.data) {
    return (
      <>
        <RegisterPage />
        <Toaster />
      </>
    );
  }

  const profile = profileQuery.data.ok;
  const isAdmin = roleQuery.data !== undefined && "admin" in roleQuery.data;

  const renderPage = () => {
    if (currentRoute === "admin" && isAdmin) return <AdminPage />;
    if (currentRoute === "deposit") return <DepositPage />;
    if (currentRoute === "withdraw") return <WithdrawPage />;
    if (currentRoute === "referral") return <ReferralPage />;
    if (currentRoute === "history") return <HistoryPage />;
    return <DashboardPage onNavigate={setCurrentRoute} />;
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 pb-20">{renderPage()}</main>
      <BottomNav
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        isAdmin={isAdmin}
        coinBalance={profile.coinBalance}
      />
      <Toaster richColors position="top-center" />
    </div>
  );
}
