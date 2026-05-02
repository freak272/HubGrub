import { useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Store, Package } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAdminKey } from "@/contexts/AdminKeyContext";

export default function Landing() {
  const [, navigate] = useLocation();
  const { role, setRole } = useRole();
  const { isUnlocked } = useAdminKey();

  useEffect(() => {
    if (role === "customer") navigate("/place-order");
    if (role === "business") navigate("/dashboard");
  }, [role, navigate]);

  const choose = (picked: "customer" | "business") => {
    setRole(picked);
    if (picked === "customer") navigate("/place-order");
    else navigate("/dashboard");
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
        <p className="text-muted-foreground text-lg">Choose your role to get started</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        <button
          onClick={() => choose("customer")}
          className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-md transition-all"
        >
          <div className="h-14 w-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <ShoppingBag className="h-7 w-7 text-blue-600" />
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold mb-1">I'm a Customer</div>
            <div className="text-sm text-muted-foreground leading-snug">
              Browse products and place your order
            </div>
          </div>
        </button>

        <button
          onClick={() => choose("business")}
          className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-md transition-all"
        >
          <div className="h-14 w-14 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <Store className="h-7 w-7 text-orange-600" />
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold mb-1">I'm a Business</div>
            <div className="text-sm text-muted-foreground leading-snug">
              {isUnlocked ? "Access your admin dashboard" : "Sign in to manage orders & inventory"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
