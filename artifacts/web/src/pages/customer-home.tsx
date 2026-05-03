import { Link } from "wouter";
import { ShoppingBag, ClipboardList, LogOut, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";

export default function CustomerHome() {
  const { customer, logout } = useAuth();
  const { businessCode } = useBusiness();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border bg-card p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome{customer?.name ? `, ${customer.name}` : ""}</h1>
            <p className="text-muted-foreground">Your customer space is ready.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/place-order" className="rounded-2xl border p-5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 font-semibold mb-2"><Store size={16} /> Order from store</div>
            <p className="text-sm text-muted-foreground">Browse, order, and see when items are ready.</p>
          </Link>
          <Link href="/my-orders" className="rounded-2xl border p-5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 font-semibold mb-2"><ClipboardList size={16} /> View my orders</div>
            <p className="text-sm text-muted-foreground">Check ready status and track orders if enabled.</p>
          </Link>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Current business: <span className="font-mono">{businessCode ?? "MAIN01"}</span></div>
          <Button variant="outline" onClick={logout}><LogOut size={16} className="mr-2" /> Sign out</Button>
        </div>
      </div>
    </div>
  );
}
