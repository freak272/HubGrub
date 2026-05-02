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
} from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useAdminKey } from "@/contexts/AdminKeyContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const businessNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/orders", label: "Live Orders", icon: ShoppingCart },
  { href: "/setup-business", label: "Setup", icon: Settings2 },
];

const customerNavItems = [
  { href: "/place-order", label: "Place Order", icon: ShoppingBag },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const { isUnlocked, lock } = useAdminKey();
  const { role, clearRole } = useRole();
  const { customer, logout } = useAuth();

  const handleLogout = () => {
    logout();
    clearRole();
    lock();
    navigate("/");
  };

  const navItems = role === "business" ? businessNavItems : role === "customer" ? customerNavItems : [];

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              <Package size={18} />
            </div>
            <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight uppercase">WAREHOUSE</h1>
          </Link>
        </div>

        {/* User info card */}
        {role && (
          <div className="px-4 pt-4">
            <div className="rounded-lg bg-sidebar-accent/40 border border-sidebar-border p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${role === "customer" ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
                {role === "customer"
                  ? <User size={16} className="text-blue-600" />
                  : <Store size={16} className="text-orange-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">
                  {role === "customer" ? (customer?.name || "Guest") : "Business Admin"}
                </div>
                {role === "customer" && customer?.phone && (
                  <div className="flex items-center gap-1 text-xs text-sidebar-foreground/50 truncate mt-0.5">
                    <Phone size={10} />
                    {customer.phone}
                  </div>
                )}
                {role === "business" && (
                  <div className="text-xs text-sidebar-foreground/50 mt-0.5">
                    {isUnlocked ? "✓ Verified" : "Locked"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {role && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2 mt-1">
                <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                  {role === "business" ? "Business" : "Customer"}
                </p>
                {role === "business" && isUnlocked && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={lock} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
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
                const needsLock = role === "business" && !isUnlocked;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                    {needsLock && <Lock size={12} className="ml-auto text-sidebar-foreground/30" />}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {role && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={13} />
              Log out
            </button>
          )}
          <div className="text-xs flex items-center justify-between text-sidebar-foreground/50 px-1">
            <div className="flex items-center gap-2">
              <Activity size={14} />
              <span>System Status</span>
            </div>
            <div className="flex items-center gap-2">
              {health?.status === "ok" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>Offline</span>
                </>
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
