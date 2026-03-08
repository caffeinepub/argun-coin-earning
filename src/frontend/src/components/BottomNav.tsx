import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Home,
  Shield,
  Users,
} from "lucide-react";
import type { AppRoute } from "../App";

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isAdmin: boolean;
  coinBalance: number;
}

const navItems = [
  { route: "dashboard" as AppRoute, icon: Home, label: "Home" },
  { route: "deposit" as AppRoute, icon: ArrowDownToLine, label: "Deposit" },
  { route: "withdraw" as AppRoute, icon: ArrowUpFromLine, label: "Withdraw" },
  { route: "referral" as AppRoute, icon: Users, label: "Team" },
  { route: "history" as AppRoute, icon: Clock, label: "History" },
];

export default function BottomNav({
  currentRoute,
  onNavigate,
  isAdmin,
}: BottomNavProps) {
  const items = isAdmin
    ? [
        ...navItems,
        { route: "admin" as AppRoute, icon: Shield, label: "Admin" },
      ]
    : navItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bottom-nav"
      style={{
        background:
          "linear-gradient(to top, oklch(0.12 0.02 265), oklch(0.14 0.02 265 / 0.97))",
        borderTop: "1px solid oklch(1 0 0 / 0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {items.map(({ route, icon: Icon, label }) => {
          const isActive = currentRoute === route;
          return (
            <button
              type="button"
              key={route}
              onClick={() => onNavigate(route)}
              data-ocid={`nav.${route === "dashboard" ? "home" : route}_link`}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]",
                isActive
                  ? "text-gold-bright"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive && "bg-gold-mid/10 shadow-gold-sm",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "drop-shadow-[0_0_6px_oklch(0.74_0.16_68)]",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-all duration-200",
                  isActive ? "text-gold-bright" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
