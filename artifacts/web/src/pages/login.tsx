import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { ArrowRight, ArrowLeft, ShieldCheck, ShoppingBag, Store, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/contexts/RoleContext";
import { useAdminKey } from "@/contexts/AdminKeyContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/login/:role");
  const roleParam = (match ? (params?.role as "customer" | "business") : "customer") ?? "customer";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessKey, setBusinessKey] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const { role, setRole } = useRole();
  const { unlock } = useAdminKey();
  const { loginCustomer } = useAuth();

  useEffect(() => {
    if (role === "customer") navigate("/place-order");
    if (role === "business") navigate("/dashboard");
  }, [role, navigate]);

  const handleCustomerLogin = () => {
    if (!phone.trim()) {
      setError("Please enter your WhatsApp phone number.");
      return;
    }
    loginCustomer(name, phone);
    setRole("customer");
    navigate("/place-order");
  };

  const handleBusinessLogin = async () => {
    if (!businessKey.trim()) {
      setError("Please enter your business key.");
      return;
    }
    setIsPending(true);
    setError("");
    try {
      const res = await fetch("/api/setup-business", {
        headers: { "x-admin-key": businessKey.trim() },
      });
      if (res.status === 403) {
        setError("Invalid business key. Please try again.");
        return;
      }
      unlock(businessKey.trim());
      setRole("business");
      navigate("/dashboard");
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={14} /> Back to role selection
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              {roleParam === "customer"
                ? <ShoppingBag className="h-7 w-7 text-primary" />
                : <Store className="h-7 w-7 text-primary" />}
            </div>
            <h1 className="text-2xl font-bold">
              {roleParam === "customer" ? "Customer Sign In" : "Business Sign In"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {roleParam === "customer"
                ? "Enter your details to start ordering"
                : "Enter your admin key to access the dashboard"}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {roleParam === "customer" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  WhatsApp Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  placeholder="e.g. +27 82 123 4567"
                  onKeyDown={(e) => e.key === "Enter" && handleCustomerLogin()}
                />
                <p className="text-xs text-muted-foreground">Used to notify you when your order is ready</p>
              </div>
              <Button className="w-full" onClick={handleCustomerLogin} disabled={!phone.trim()}>
                Start Ordering <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">
                  Business Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="key"
                  type="password"
                  value={businessKey}
                  onChange={(e) => { setBusinessKey(e.target.value); setError(""); }}
                  placeholder="Enter your business key"
                  onKeyDown={(e) => e.key === "Enter" && handleBusinessLogin()}
                />
                <p className="text-xs text-muted-foreground">
                  Default key: <code className="bg-muted px-1 py-0.5 rounded text-xs">mysecret123</code>
                </p>
              </div>
              <Button className="w-full" onClick={handleBusinessLogin} disabled={isPending || !businessKey.trim()}>
                {isPending ? "Verifying..." : (
                  <><ShieldCheck className="mr-2 h-4 w-4" /> Access Dashboard</>
                )}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {roleParam === "customer" ? (
            <>Not a customer? <Link href="/login/business" className="underline hover:text-foreground">Sign in as Business</Link></>
          ) : (
            <>Not a business? <Link href="/login/customer" className="underline hover:text-foreground">Continue as Customer</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
