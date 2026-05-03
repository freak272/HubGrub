import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Store, Package, ArrowRight, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/contexts/BusinessContext";

type BizSummary = { code: string; name: string; type: string | null; subtype: string | null; emoji: string | null };

export default function Landing() {
  const [, navigate] = useLocation();
  const { setBusinessCode } = useBusiness();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [businesses, setBusinesses] = useState<BizSummary[]>([]);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((data) => setBusinesses(data))
      .catch(() => {});
  }, []);

  const handleCodeSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Enter a business code to continue."); return; }
    setIsSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/b/${trimmed}/profile`);
      if (!res.ok) { setError("Business not found. Check the code and try again."); return; }
      setBusinessCode(trimmed);
      navigate("/login/customer");
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectBusiness = (biz: BizSummary) => {
    setBusinessCode(biz.code);
    navigate("/login/customer");
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
        <p className="text-muted-foreground text-lg">Choose how to continue</p>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Customer card */}
          <div className="flex flex-col gap-4 p-6 rounded-2xl border-2 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-base">Order as Customer</div>
                <div className="text-xs text-muted-foreground">Enter a business code or pick below</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="Business code (e.g. ABC123)"
                className="flex-1 font-mono uppercase text-sm tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && handleCodeSearch()}
                maxLength={8}
              />
              <Button
                size="icon"
                onClick={handleCodeSearch}
                disabled={isSearching || !code.trim()}
                className="shrink-0"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}

            {businesses.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active businesses</p>
                {businesses.map((biz) => (
                  <button
                    key={biz.code}
                    onClick={() => selectBusiness(biz)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                  >
                    <span className="text-xl">{biz.emoji ?? "🏪"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{biz.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{biz.code}</div>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Business card */}
          <button
            onClick={() => navigate("/login/business")}
            className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-md transition-all"
          >
            <div className="h-14 w-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <Store className="h-7 w-7 text-orange-600" />
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold mb-1">Register My Business</div>
              <div className="text-sm text-muted-foreground leading-snug">Sign in to manage orders & inventory</div>
            </div>
            <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
              Get started <ArrowRight size={14} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
