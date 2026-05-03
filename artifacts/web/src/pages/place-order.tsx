import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CheckCircle2, PenLine, Package, Phone, ClipboardList, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";
import { useLocation } from "wouter";

type Mode = "type" | "browse";

type Product = { id: string; name: string; price: number; stock: number };
type BizProfile = {
  type: "restaurant" | "shop" | "service" | null;
  subtype: "fastfood" | "cafe" | "pizza" | null;
  name: string;
  description?: string;
  themeColor?: string;
  emoji?: string;
  trackingEnabled?: boolean;
};

export default function PlaceOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { customer } = useAuth();
  const { businessCode, isDefaultBusiness } = useBusiness();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<Mode>("type");
  const [customerName, setCustomerName] = useState(customer?.name ?? "");
  const [contact, setContact] = useState(customer?.contact ?? "");
  const [contactMethod, setContactMethod] = useState<"phone" | "email">("phone");
  const [itemsText, setItemsText] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const profileUrl = isDefaultBusiness ? "/api/business-profile" : `/api/b/${businessCode}/profile`;
  const productsUrl = isDefaultBusiness ? "/api/products" : `/api/b/${businessCode}/products`;

  const { data: bizProfile } = useQuery<BizProfile>({
    queryKey: ["business-profile", businessCode],
    queryFn: () => fetch(profileUrl).then((r) => r.json()),
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products", businessCode],
    queryFn: () => fetch(productsUrl).then((r) => r.json()),
  });

  const theme = useBusinessTheme(bizProfile);
  const trackingEnabled = Boolean(bizProfile?.trackingEnabled);
  const canTrack = trackingEnabled || bizProfile?.type === "restaurant";

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setSelectedItems((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(current + delta, maxStock));
      return { ...prev, [productId]: next };
    });
  };

  const totalBrowseItems = Object.values(selectedItems).reduce((a, b) => a + b, 0);
  const estimatedTotal = products
    ? Object.entries(selectedItems).reduce((sum, [id, qty]) => {
        const product = products.find((p) => p.id === id);
        return sum + (product ? product.price * qty : 0);
      }, 0)
    : 0;

  const orderFormUrl = isDefaultBusiness ? "/api/order-form" : `/api/b/${businessCode}/order-form`;
  const ordersUrl = isDefaultBusiness ? "/api/orders" : `/api/b/${businessCode}/orders`;

  const handleTypeSubmit = async () => {
    const trimmed = itemsText.trim();
    if (!trimmed) { toast({ title: "Please describe your order.", variant: "destructive" }); return; }
    setIsPending(true);
    try {
      const res = await fetch(orderFormUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: customerName.trim() || "Guest", phone: contact.trim() || undefined, items: trimmed }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed to place order"); }
      queryClient.invalidateQueries({ queryKey: ["products", businessCode] });
      setSubmitted(true);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Failed to place order.", variant: "destructive" });
    } finally { setIsPending(false); }
  };

  const handleBrowseSubmit = async () => {
    const items = Object.entries(selectedItems).filter(([, qty]) => qty > 0).map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) { toast({ title: "Select at least one item.", variant: "destructive" }); return; }
    setIsPending(true);
    try {
      const res = await fetch(ordersUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: customerName.trim() || "Guest", phone: contact.trim() || undefined, items }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed to place order"); }
      queryClient.invalidateQueries({ queryKey: ["products", businessCode] });
      setSubmitted(true);
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Failed to place order.", variant: "destructive" });
    } finally { setIsPending(false); }
  };

  const reset = () => { setSubmitted(false); setItemsText(""); setSelectedItems({}); };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: theme.bgLight }}>
        <div className="px-8 py-6 border-b" style={theme.heroStyle}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{theme.emoji}</span>
            <h1 className="text-xl font-bold">{bizProfile?.name ?? "Order"}</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm w-full text-center space-y-5">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-3xl" style={theme.accentStyle}>✓</div>
            </div>
            <h2 className="text-2xl font-bold">
              {bizProfile?.type === "service" ? "Booking Received!" : bizProfile?.type === "shop" ? "Order Placed!" : "Order Received!"}
            </h2>
            <p className="text-muted-foreground">
              Thank you{customerName ? `, ${customerName}` : ""}! We'll take care of it shortly.
            </p>
            {contact && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                {contactMethod === "email" ? <Mail size={14} /> : <Phone size={14} />}
                We'll notify you at {contact}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button onClick={reset} style={theme.buttonStyle}>
                Place Another {bizProfile?.type === "service" ? "Booking" : "Order"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/my-orders")}>Go to My Orders</Button>
              {!canTrack && <p className="text-xs text-muted-foreground">This business has turned off live tracking, but you can still check when your order is ready in My Orders.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: theme.bgLight }}>
      <div className="px-8 py-8 border-b" style={theme.heroStyle}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">{theme.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{bizProfile?.name ?? "Place an Order"}</h1>
              {bizProfile?.description && <p className="text-muted-foreground text-sm mt-0.5">{bizProfile.description}</p>}
            </div>
          </div>
          <p className="text-muted-foreground mt-3">{theme.orderPrompt}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full p-8 space-y-6">
        <div className="rounded-2xl border bg-card p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Customer Space</div>
            <div className="text-xs text-muted-foreground">Move between ordering and your status dashboard</div>
          </div>
          <div className="flex gap-2">
            <Button variant={mode === "type" ? "default" : "outline"} size="sm" onClick={() => setMode("type")}>Place Order</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/my-orders")}>My Orders</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Your Name</Label>
            <Input id="customer" placeholder="Optional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Details</Label>
            <div className="flex gap-2">
              <Input id="contact" type={contactMethod === "email" ? "email" : "tel"} placeholder={contactMethod === "email" ? "e.g. name@example.com" : "e.g. +27 82 123 4567"} value={contact} onChange={(e) => setContact(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setContactMethod((m) => (m === "phone" ? "email" : "phone"))}>
                {contactMethod === "phone" ? <Mail size={16} /> : <Phone size={16} />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">We can notify you by phone or email — no WhatsApp required.</p>
          </div>
        </div>

        <div className="flex border rounded-lg overflow-hidden">
          <button onClick={() => setMode("type")} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors" style={mode === "type" ? theme.buttonStyle : { color: "#6b7280" }}>
            <PenLine size={15} /> Type my {bizProfile?.type === "service" ? "request" : "order"}
          </button>
          <button onClick={() => setMode("browse")} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors" style={mode === "browse" ? theme.buttonStyle : { color: "#6b7280" }}>
            <Package size={15} /> {theme.browseLabel}
          </button>
        </div>

        {mode === "type" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="items">{bizProfile?.type === "service" ? "Describe what you need" : "What would you like?"}</Label>
              <Textarea id="items" placeholder={theme.searchPlaceholder} value={itemsText} onChange={(e) => setItemsText(e.target.value)} className="resize-none" rows={3} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTypeSubmit(); }} />
              <p className="text-xs text-muted-foreground">Separate multiple items with commas. Press ⌘ + Enter to submit.</p>
            </div>
            <Button className="w-full" size="lg" onClick={handleTypeSubmit} disabled={isPending || !itemsText.trim()} style={theme.buttonStyle}>
              {isPending ? "Submitting…" : theme.orderVerb}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !products || products.length === 0 ? (
              <div className="p-8 text-center border rounded-lg bg-white text-muted-foreground text-sm">
                No {theme.productLabel.toLowerCase()}s available right now.
              </div>
            ) : (
              <div className="border rounded-xl bg-white divide-y overflow-hidden shadow-sm">
                {products.map((product) => (
                  <div key={product.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.price > 0 ? `$${product.price.toFixed(2)}` : "Price TBD"}
                        {product.stock < 10 && <span className="ml-2 text-amber-600 font-medium">Only {product.stock} left</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="h-8 w-8 rounded-full border flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors disabled:opacity-40" onClick={() => updateQuantity(product.id, -1, product.stock)} disabled={(selectedItems[product.id] || 0) <= 0}>−</button>
                      <span className="w-6 text-center text-sm font-mono font-medium">{selectedItems[product.id] || 0}</span>
                      <button className="h-8 w-8 rounded-full border flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors disabled:opacity-40" onClick={() => updateQuantity(product.id, 1, product.stock)} disabled={(selectedItems[product.id] || 0) >= product.stock}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalBrowseItems > 0 && (
              <div className="rounded-lg p-4 flex items-center justify-between" style={theme.accentStyle}>
                <div className="text-sm font-medium">{totalBrowseItems} item{totalBrowseItems !== 1 ? "s" : ""} selected</div>
                {estimatedTotal > 0 && <div className="font-bold font-mono">Est. ${estimatedTotal.toFixed(2)}</div>}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handleBrowseSubmit} disabled={isPending || totalBrowseItems === 0} style={theme.buttonStyle}>
              {isPending ? "Submitting…" : theme.orderVerb}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
