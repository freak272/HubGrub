import { Link, useLocation } from "wouter";
import { Package, LayoutDashboard, ShoppingCart, Activity } from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-sm flex items-center justify-center text-primary-foreground font-bold">
              <Package size={18} />
            </div>
            <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight uppercase">WAREHOUSE</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs flex items-center justify-between text-sidebar-foreground/50">
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span>System Status</span>
          </div>
          <div className="flex items-center gap-2">
            {health?.status === 'ok' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Online</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
