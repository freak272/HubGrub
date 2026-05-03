import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { ArrowRight, ArrowLeft, ShieldCheck, ShoppingBag, Store, AlertCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/contexts/RoleContext";
import { useAdminKey } from "@/contexts/AdminKeyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness, type CustomerBusiness } from "@/contexts/BusinessContext";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { useQuery } from "@tanstack/react-query";

type BizProfile = {
  type: "restaurant" | "shop" | "service" | null;
  subtype: "fastfood" | "cafe" | "pizza" | null;
  name: string;
  description?: string;
  themeColor?: string;
  emoji?: string;
};

export default function Login() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/login/:role");
  const roleParam = (match ? (params?.role as "customer" | "business") : "customer") ?? "customer";

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactMethod, setContactMethod] = useState<"phone" | "email">("phone");
  const [businessKey, setBusinessKey] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const { role, setRole } = useRole();
  const { unlock } = useAdminKey();
  const { loginCustomer } = useAuth();
  const { activeBusinessCode, isDefaultBusiness, addCustomerBusiness } = useBusiness();

  const bizFromQuery = new URLSearchParams(window.location.search).get("biz")?.toUpperCase() ?? null;
  const profileUrl = roleParam === "customer" && bizFromQuery ? `/api/b/${bizFromQuery}/profile` : null;
  const { data: bizProfile } = useQuery<BizProfile>({
    queryKey: ["biz-profile-login", bizFromQuery],
    queryFn: () => fetch(profileUrl!).then((r) => r.json()),
    enabled: roleParam === "customer" && !!profileUrl,
  });

  const theme = useBusinessTheme(bizProfile ?? null);

  useEffect(() => {
    if (role === "customer") navigate("/customer");
    if (role === "business") navigate("/dashboard");
  }, [role, navigate]);

  const handleCustomerLogin = () => {
    if (!contact.trim()) {
      setError("Please enter your phone number or email address.");
      return;
    }
    loginCustomer(name, contact);
    if (bizFromQuery && bizProfile) {
      const business: CustomerBusiness = { code: bizFromQuery, name: bizProfile.name, emoji: bizProfile.emoji ?? null };
      addCustomerBusiness(business);
    }
    setRole("customer");
    navigate("/customer");
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

  const hasBizBranding = roleParam === "customer" && bizProfile && bizProfile.name;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={hasBizBranding ? (theme.bgLight ? { background: theme.bgLight } : {}) : {}}>
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={14} /> Back to selection
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center" style={hasBizBranding ? theme.accentStyle : { background: "hsl(var(--primary) / 0.1)" }}>
              {roleParam === "customer" ? <ShoppingBag className="h-7 w-7" style={hasBizBranding ? {} : { color: "hsl(var(--primary))" }} /> : <Store className="h-7 w-7 text-primary" />}
            </div>
            <h1 className="text-2xl font-bold">{roleParam === "customer" ? "Customer Sign In" : "Business Sign In"}</h1>
            <p className="text-sm text-muted-foreground">
              {roleParam === "customer"
                ? bizProfile
                  ? `Join ${bizProfile.name} and open your customer space`
                  : "Scan a business QR to open your customer space"
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
                <Label htmlFor="name">Your Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Smith" onKeyDown={(e) => e.key === "Enter" && handleCustomerLogin()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Details <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="contact"
                    type={contactMethod === "email" ? "email" : "tel"}
                    value={contact}
                    onChange={(e) => { setContact(e.target.value); setError(""); }}
                    placeholder={contactMethod === "email" ? "e.g. name@example.com" : "e.g. +1 555 123 4567"}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomerLogin()}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => { setContactMethod((m) => (m === "phone" ? "email" : "phone")); setContact(""); setError(""); }} title={contactMethod === "phone" ? "Switch to email" : "Switch to phone"}>
                    {contactMethod === "phone" ? <Mail size={16} /> : <Phone size={16} />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Used to look up your orders later.</p>
              </div>
              <Button className="w-full" onClick={handleCustomerLogin} disabled={!contact.trim()} style={hasBizBranding ? theme.buttonStyle : {}}>
                Enter Customer Space <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Business Key <span className="text-destructive">*</span></Label>
                <Input id="key" type="password" value={businessKey} onChange={(e) => { setBusinessKey(e.target.value); setError(""); }} placeholder="Enter your business key" onKeyDown={(e) => e.key === "Enter" && handleBusinessLogin()} />
                <p className="text-xs text-muted-foreground">Default key: <code className="bg-muted px-1 py-0.5 rounded text-xs">mysecret123</code></p>
              </div>
              <Button className="w-full" onClick={handleBusinessLogin} disabled={isPending || !businessKey.trim()}>
                {isPending ? "Verifying..." : (<><ShieldCheck className="mr-2 h-4 w-4" /> Access Dashboard</>)}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {roleParam === "customer" ? (
            <>Have a business QR? scan it and sign in to add that shop to your space.</>
          ) : (
            <>Not a business? <Link href="/login/customer" className="underline hover:text-foreground">Continue as Customer</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
