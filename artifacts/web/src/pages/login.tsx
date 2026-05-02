import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowRight, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/contexts/RoleContext";
import { useAdminKey } from "@/contexts/AdminKeyContext";

export default function Login() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/login/:role");
  const roleParam = (match ? (params?.role as "customer" | "business") : "customer") ?? "customer";
  const [phone, setPhone] = useState("");
  const [businessKey, setBusinessKey] = useState("");
  const { role, setRole } = useRole();
  const { unlock } = useAdminKey();

  useEffect(() => {
    if (role === "customer") navigate("/place-order");
    if (role === "business") navigate("/dashboard");
  }, [role, navigate]);

  const handleLogin = () => {
    if (roleParam === "customer") {
      setRole("customer");
      navigate("/place-order");
      return;
    }

    if (businessKey.trim()) {
      unlock(businessKey.trim());
      setRole("business");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {roleParam === "customer" ? <ShoppingBag className="h-6 w-6 text-primary" /> : <Store className="h-6 w-6 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold">{roleParam === "customer" ? "Customer Login" : "Business Login"}</h1>
          <p className="text-sm text-muted-foreground">
            {roleParam === "customer" ? "Continue with your phone number" : "Enter your business admin key"}
          </p>
        </div>

        {roleParam === "customer" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +27 82 123 4567" />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={!phone.trim()}>
              Continue as Customer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Business Key</Label>
              <Input id="key" type="password" value={businessKey} onChange={(e) => setBusinessKey(e.target.value)} placeholder="Enter business key" />
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={!businessKey.trim()}>
              Unlock Business <ShieldCheck className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
