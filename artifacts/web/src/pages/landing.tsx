import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Store, Package, ArrowRight, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/contexts/BusinessContext";

export default function Landing() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bizParam = params.get("biz");
    if (bizParam) {
      setIsAutoRedirecting(true);
      fetch(`/api/b/${bizParam.toUpperCase()}/profile`)
        .then((r) => {
          if (r.ok) {
            navigate(`/customer?biz=${bizParam.toUpperCase()}`);
          } else {
            setIsAutoRedirecting(false);
          }
        })
        .catch(() => setIsAutoRedirecting(false));
    }
  }, [navigate]);

  const handleCodeSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Enter a business code to continue."); return; }
    setIsSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/b/${trimmed}/profile`);
      if (!res.ok) { setError("Business not found. Check the code and try again."); return; }
      navigate(`/customer?biz=${trimmed}`);
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-screen bg-background">
      <div className="text-center mb-10 space-y-3">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Package className="h-9 w-9 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Order System</h1>
        <p className="text-muted-foreground text-lg">Scan your business QR to enter your space</p>
      </div>

      <div className="w-full max-w-xl rounded-3xl border bg-card p-8 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="font-semibold text-lg">Continue with a business code</div>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="Scan QR or enter code"
              className="flex-1 font-mono uppercase text-sm tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && handleCodeSearch()}
              maxLength={8}
            />
            <Button size="icon" onClick={handleCodeSearch} disabled={isSearching || !code.trim()} className="shrink-0">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-5 bg-muted/20">
            <div className="flex items-center gap-2 font-semibold mb-2"><ShoppingBag size={16} /> Customer space</div>
            <p className="text-sm text-muted-foreground">Open your business dashboard after scanning the QR.</p>
          </div>
          <button onClick={() => navigate("/login/business")} className="rounded-2xl border p-5 text-left hover:border-primary transition-colors">
            <div className="flex items-center gap-2 font-semibold mb-2"><Store size={16} /> Business sign in</div>
            <p className="text-sm text-muted-foreground">Manage your own shop setup and orders.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
