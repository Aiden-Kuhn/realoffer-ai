import { LayoutDashboard, Search, Bookmark, Settings, type LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analyze Deal", href: "/dashboard/analyze", icon: Search },
  { label: "Saved Deals", href: "/dashboard/deals", icon: Bookmark },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/analyze": "Analyze Deal",
  "/dashboard/deals": "Saved Deals",
  "/dashboard/settings": "Settings",
};
