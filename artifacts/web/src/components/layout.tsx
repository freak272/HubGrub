import { Link, useLocation } from "wouter";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Activity,
  Lock,
  ShoppingBag,
  LogOut,
  Settings2,
  Phone,
  User,
  Store,
  ClipboardList,
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useAdminKey } from "@/contexts/AdminKeyContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BizProfile = {
  type: "restaurant" | "shop" | "service" | null;
  subtype: "fastfood" | "cafe" | "pizza" | null;
  name: string;
  description?: string;
  themeColor?: string;
  emoji?: string;
};

const businessNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/orders", label: "Live Orders", icon: ShoppingCart },
  { href: "/setup-business", label: "Setup", icon: Settings2 },
];

const customerNavItems = [
  { href: "/place-order", label: "Place Order", icon: ShoppingBag },
  { href: "/my-orders", label: "My Orders", icon: ClipboardList },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const { isUnlocked, lock } = useAdminKey();
  const { role, clearRole } = useRole();
  const { customer, logout } = useAuth();

  const isLoginOrLanding = location === "/" || location.startsWith("/login");
  if (isLoginOrLanding) {
    return <main className="flex-1 overflow-auto flex flex-col">{children}</main>;
  }

  return <AppSidebar location={location} navigate={navigate} health={health?.status === "ok"} isUnlocked={isUnlocked} lock={lock} role={role} clearRole={clearRole} customer={customer} logout={logout} />;
}

function AppSidebar({
  location,
  navigate,
  health,
  isUnlocked,
  lock,
  role,
  clearRole,
  customer,
  logout,
}: {
  location: string;
  navigate: (to: string) => void;
  health: boolean;
  isUnlocked: boolean;
  lock: () => void;
  role: "customer" | "business" | null;
  clearRole: () => void;
  customer: { name: string | null; phone: string | null } | null;
  logout: () => void;
}) {
  const business = useBusiness();
  const { businessCode, isDefaultBusiness, setBusinessCode } = business;
  const safeBusinessCode = businessCode ?? "DEFAULT";
  const profileUrl = isDefaultBusiness ? "/api/business-profile" : `/api/b/${safeBusinessCode}/profile`;

  const { data: bizProfile } = useQuery<BizProfile>({
    queryKey: ["biz-profile-sidebar", safeBusinessCode],
    queryFn: () => fetch(profileUrl).then((r) => r.json()),
    enabled: !!role && (role !== "customer" || isDefaultBusiness || !!businessCode),
  });

  const theme = useBusinessTheme(bizProfile);

  const handleLogout = () => {
    logout();
    clearRole();
    lock();
    setBusinessCode(null);
    navigate("/");
  };

  const navItems = role === "business" ? businessNavItems : role === "customer" ? customerNavItems : [];

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r flex-shrink-0 flex flex-col" style={{ backgroundColor: "hsl(var(--sidebar))", borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="p-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-sm flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: role === "customer" ? theme.primaryHex : "hsl(var(--primary))" }}>
              {role === "customer" ? theme.emoji : <Package size={16} />}
            </div>
            <h1 className="font-bold text-lg tracking-tight uppercase" style={{ color: "hsl(var(--sidebar-foreground))" }}>
              {role === "customer" && bizProfile?.name ? bizProfile.name : "WAREHOUSE"}
            </h1>
          </Link>
        </div>

        {role && (
          <div className="px-4 pt-4">
            <div className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: role === "customer" ? theme.badgeBg : "hsl(var(--sidebar-accent) / 0.4)", border: `1px solid ${role === "customer" ? theme.borderColor : "hsl(var(--sidebar-border))"}` }}>
              <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: role === "customer" ? theme.bgLight : "hsl(var(--muted))" }}>
                {role === "customer" ? <User size={16} style={{ color: theme.primaryHex }} /> : <Store size={16} className="text-orange-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                  {role === "customer" ? (customer?.name || "Guest") : "Business Admin"}
                </div>
                {role === "customer" && customer?.phone && (
                  <div className="flex items-center gap-1 text-xs truncate mt-0.5" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>
                    <Phone size={10} />
                    {customer.phone}
                  </div>
                )}
                {role === "business" && <div className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>{isUnlocked ? "✓ Verified" : "Locked"}</div>}
              </div>
            </div>
          </div>
        )}

        {role === "customer" && !isDefaultBusiness && businessCode && (
          <div className="px-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs" style={theme.accentStyle}>
              <span>{theme.emoji}</span>
              <span className="font-medium">{bizProfile?.name ?? businessCode}</span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {role && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2 mt-1">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--sidebar-foreground) / 0.4)" }}>
                  {role === "business" ? "Business" : "Customer"}
                </p>
                {role === "business" && isUnlocked && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={lock} style={{ color: "hsl(var(--sidebar-foreground) / 0.4)" }} className="hover:opacity-80 transition-opacity">
                        <Lock size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Lock admin</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                const activeStyle = role === "customer"
                  ? { backgroundColor: theme.badgeBg, color: theme.primaryHex, fontWeight: "600" }
                  : { backgroundColor: "hsl(var(--sidebar-accent))", color: "hsl(var(--sidebar-accent-foreground))", fontWeight: "600" };
                const inactiveStyle = { color: "hsl(var(--sidebar-foreground) / 0.7)" };

                return (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:opacity-90" style={isActive ? activeStyle : inactiveStyle}>
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t space-y-3" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          {role && (
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors hover:bg-destructive/10 hover:text-destructive" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>
              <LogOut size={13} />
              Log out
            </button>
          )}
          <div className="text-xs flex items-center justify-between px-1" style={{ color: "hsl(var(--sidebar-foreground) / 0.5)" }}>
            <div className="flex items-center gap-2">
              <Activity size={14} />
              <span>System Status</span>
            </div>
            <div className="flex items-center gap-2">
              {health ? (
                <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span>Online</span></>
              ) : (
                <><div className="w-2 h-2 rounded-full bg-destructive" /><span>Offline</span></>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
