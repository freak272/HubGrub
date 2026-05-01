import { Link, useLocation } from "wouter";
import { Package, LayoutDashboard, ShoppingCart, Activity, Lock, ShoppingBag, LogOut, Home } from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useAdminKey } from "@/contexts/AdminKeyContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const { isUnlocked, lock } = useAdminKey();

  const adminNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/orders", label: "Live Orders", icon: ShoppingCart },
  ];

  const publicNavItems = [
    { href: "/place-order", label: "Place Order", icon: ShoppingBag },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              <Package size={18} />
            </div>
            <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight uppercase">WAREHOUSE</h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-4">
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${location === "/" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
            >
              <Home size={16} />
              <span className="text-sm">Home</span>
            </Link>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">Customer</p>
            {publicNavItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Business</p>
              {isUnlocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={lock} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
                      <LogOut size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Lock admin</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            {adminNavItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                  <Icon size={18} />
                  {item.label}
                  {!isUnlocked && <Lock size={12} className="ml-auto text-sidebar-foreground/30" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs flex items-center justify-between text-sidebar-foreground/50">
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
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
