import { Link, useLocation } from "wouter";
import { ShoppingBag, ClipboardList, LogOut, Store, PlusCircle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";

export default function CustomerHome() {
  const [, navigate] = useLocation();
  const { customer, logout } = useAuth();
  const { activeBusinessCode, customerBusinesses, setActiveBusinessCode, addCustomerBusiness } = useBusiness();

  const handleScanPlaceholder = () => {
    const code = window.prompt("Enter business code to unlock");
    if (!code) return;
    const normalized = code.trim().toUpperCase();
    addCustomerBusiness({ code: normalized, name: normalized });
    navigate(`/customer?biz=${normalized}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-3xl border bg-card p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome{customer?.name ? `, ${customer.name}` : ""}</h1>
            <p className="text-muted-foreground">Your customer space is ready.</p>
          </div>
        </div>

        <div className="rounded-2xl border p-5 bg-muted/20">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="font-semibold">My Shops</div>
              <div className="text-sm text-muted-foreground">Switch between merchants you unlocked with QR.</div>
            </div>
            <button onClick={handleScanPlaceholder} className="inline-flex items-center gap-2 text-sm underline text-muted-foreground hover:text-foreground">
              <PlusCircle size={16} /> Add another
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customerBusinesses.length === 0 ? (
              <div className="text-sm text-muted-foreground">Scan a business QR to add it here.</div>
            ) : customerBusinesses.map((biz) => (
              <button key={biz.code} onClick={() => { setActiveBusinessCode(biz.code); navigate(`/customer?biz=${biz.code}`); }} className={`rounded-2xl border p-4 hover:bg-muted/40 transition-colors text-left ${biz.code === activeBusinessCode ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-center gap-2 font-semibold mb-1"><Store size={16} /> {biz.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{biz.code}</div>
                <div className="mt-2 text-xs inline-flex items-center gap-1 text-primary"><ArrowRightLeft size={12} /> Switch to this shop</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href={activeBusinessCode ? `/customer?biz=${activeBusinessCode}` : "/"} className="rounded-2xl border p-5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 font-semibold mb-2"><Store size={16} /> Place order</div>
            <p className="text-sm text-muted-foreground">Go to the business you scanned and order again.</p>
          </Link>
          <Link href="/my-orders" className="rounded-2xl border p-5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 font-semibold mb-2"><ClipboardList size={16} /> View my orders</div>
            <p className="text-sm text-muted-foreground">Check order status in your customer dashboard.</p>
          </Link>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Current business: <span className="font-mono">{activeBusinessCode ?? "None"}</span></div>
          <Button variant="outline" onClick={logout}><LogOut size={16} className="mr-2" /> Sign out</Button>
        </div>
      </div>
    </div>
  );
}
