"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut, Sparkles, Satellite, FlaskConical } from "lucide-react";
import { DASHBOARD_NAV_ITEMS } from "@/config/dashboardNav";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePropertyDataMode } from "@/hooks/usePropertyDataMode";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const propertyDataMode = usePropertyDataMode();

  async function handleSignOut() {
    await signOut();
    // Full navigation, not router.push: ensures the server-side auth guard
    // in app/dashboard/layout.tsx sees the cleared session on next request
    // rather than racing a client-side transition.
    window.location.href = "/";
  }

  return (
    <nav
      aria-label="Dashboard navigation"
      className={`flex h-full flex-col border-r border-border bg-surface transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className={`flex items-center h-16 shrink-0 border-b border-border ${collapsed ? "justify-center px-0" : "px-5"}`}>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent via-accent-2 to-accent-3">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          {!collapsed ? (
            <span className="truncate text-[15px] font-semibold tracking-tight text-white">
              RealOffer <span className="text-muted font-normal">AI</span>
            </span>
          ) : null}
        </Link>
      </div>

      <ul className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="relative">
              {active ? (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent-3" />
              ) : null}
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  active
                    ? "bg-white/[0.07] text-white"
                    : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon
                  className={`h-[18px] w-[18px] shrink-0 ${active ? "text-accent-3" : "text-white/40 group-hover:text-white/70"}`}
                  strokeWidth={1.85}
                />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border p-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden md:flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/45 hover:text-white hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-150 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed ? "Collapse" : null}
        </button>

        {!collapsed ? (
          <div className="flex flex-col gap-1.5">
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                propertyDataMode === "rentcast"
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : "border-accent-3/25 bg-accent-3/10 text-accent-3"
              }`}
              title="Where property, listing, valuation, and comparable data comes from"
            >
              {propertyDataMode === "rentcast" ? <Satellite className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
              {propertyDataMode === "rentcast" ? "RentCast Live Data" : "Demo Property Data"}
            </span>
          </div>
        ) : null}

        <div className={`flex items-center gap-2.5 rounded-lg px-1 py-1.5 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {(user?.fullName || user?.email || "U")[0].toUpperCase()}
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.fullName || "Account"}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-150 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.85} />
          {!collapsed ? "Log out" : null}
        </button>
      </div>
    </nav>
  );
}
