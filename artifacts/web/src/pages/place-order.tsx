import { useState } from "react";
import { useListProducts, getListProductsQueryKey, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ShoppingBag, CheckCircle2, PenLine, Package, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "type" | "browse";

export default function PlaceOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { customer } = useAuth();

  const [mode, setMode] = useState<Mode>("type");
  const [customerName, setCustomerName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [itemsText, setItemsText] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { data: products, isLoading } = useListProducts({
    query: { queryKey: getListProductsQueryKey() },
  });

  const { data: bizProfile } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => fetch("/api/business-profile").then((r) => r.json()) as Promise<{
      type: "restaurant" | "shop" | "service" | null;
      subtype: "fastfood" | "cafe" | "pizza" | null;
      name: string;
    }>,
  });

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

  const handleTypeSubmit = async () => {
    const trimmed = itemsText.trim();
    if (!trimmed) {
      toast({ title: "Please describe your order.", variant: "destructive" });
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/order-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerName.trim() || "Guest",
          phone: phone.trim() || undefined,
          items: trimmed,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to place order");
      }

      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      setSubmitted(true);
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Failed to place order.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleBrowseSubmit = async () => {
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      toast({ title: "Select at least one item.", variant: "destructive" });
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: customerName.trim() || "Guest", items }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to place order");
      }

      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      setSubmitted(true);
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : "Failed to place order.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setItemsText("");
    setSelectedItems({});
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Order Placed!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you{customerName ? `, ${customerName}` : ""}! We'll process your order shortly.
          </p>
          {phone && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Phone size={14} />
              We'll notify you on {phone}
            </div>
          )}
          <Button variant="outline" onClick={reset}>
            Place Another Order
          </Button>
        </div>
      </div>
    );
  }

  const greeting = bizProfile?.type === "restaurant"
    ? `🍽️ Welcome to our ${bizProfile.subtype === "fastfood" ? "fast food" : bizProfile.subtype === "cafe" ? "café" : bizProfile.subtype === "pizza" ? "pizza" : ""} restaurant`
    : bizProfile?.type === "shop"
    ? "🛍️ Welcome to our store"
    : bizProfile?.type === "service"
    ? "🔧 Welcome to our service"
    : bizProfile?.name ?? "Place an Order";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        </div>
        <p className="text-muted-foreground">Type what you'd like, or browse available products below.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Your Name</Label>
          <Input
            id="customer"
            placeholder="Optional"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. +27 82 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div className="flex border rounded-lg overflow-hidden">
        <button
          onClick={() => setMode("type")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === "type"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <PenLine size={15} />
          Type my order
        </button>
        <button
          onClick={() => setMode("browse")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            mode === "browse"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Package size={15} />
          Browse products
        </button>
      </div>

      {mode === "type" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="items">What would you like?</Label>
            <Textarea
              id="items"
              placeholder="e.g. Burger x2, Coke x1, Fries"
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              className="resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTypeSubmit();
              }}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple items with commas. Press ⌘ + Enter to submit.
            </p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleTypeSubmit}
            disabled={isPending || !itemsText.trim()}
          >
            {isPending ? "Placing Order…" : "Place Order"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="p-8 text-center border rounded-lg text-muted-foreground text-sm">
              No products available right now.
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {products.map((product) => (
                <div key={product.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ${product.price.toFixed(2)} each
                      {product.stock < 10 && (
                        <span className="ml-2 text-amber-600 font-medium">
                          Only {product.stock} left
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(product.id, -1, product.stock)}
                      disabled={(selectedItems[product.id] || 0) <= 0}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center text-sm font-mono font-medium">
                      {selectedItems[product.id] || 0}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(product.id, 1, product.stock)}
                      disabled={(selectedItems[product.id] || 0) >= product.stock}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalBrowseItems > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {totalBrowseItems} item{totalBrowseItems !== 1 ? "s" : ""} selected
              </div>
              <div className="font-semibold font-mono">Est. ${estimatedTotal.toFixed(2)}</div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleBrowseSubmit}
            disabled={isPending || totalBrowseItems === 0}
          >
            {isPending ? "Placing Order…" : "Place Order"}
          </Button>
        </div>
      )}
    </div>
  );
}
