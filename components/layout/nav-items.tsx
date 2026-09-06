import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  Settings,
  Users,
  Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Contas", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/dashboard/categories", label: "Categorias", icon: Tags },
];

export const masterNavItems: NavItem[] = [
  { href: "/master", label: "Métricas", icon: Gauge },
  { href: "/master/users", label: "Usuários", icon: Users },
];

export function navItemsForRole(role: "MASTER" | "USER"): NavItem[] {
  return role === "MASTER" ? masterNavItems : userNavItems;
}

export function settingsNavItemForRole(role: "MASTER" | "USER"): NavItem {
  return {
    href: role === "MASTER" ? "/master/settings" : "/dashboard/settings",
    label: "Configurações",
    icon: Settings,
  };
}
