import { useState } from "react";
import { useListProducts, getListProductsQueryKey, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaceOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: products, isLoading } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const createOrder = useCreateOrder();

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setSelectedItems((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(current + delta, maxStock));
      return { ...prev, [productId]: next };
    });
  };

  const totalItems = Object.values(selectedItems).reduce((a, b) => a + b, 0);

  const estimatedTotal = products
    ? Object.entries(selectedItems).reduce((sum, [id, qty]) => {
        const product = products.find((p) => p.id === id);
        return sum + (product ? product.price * qty : 0);
      }, 0)
    : 0;

  const handleSubmit = () => {
    const items = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      toast({ title: "Select at least one item", variant: "destructive" });
      return;
    }

    createOrder.mutate(
      { data: { customer: customerName.trim() || "Guest", items } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          setSubmitted(true);
        },
        onError: () => {
          toast({ title: "Failed to place order. Please try again.", variant: "destructive" });
        },
      }
    );
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
          <h2 className="text-xl font-semibold">Order Received!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you{customerName ? `, ${customerName}` : ""}! We'll process your order shortly.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSubmitted(false);
              setSelectedItems({});
              setCustomerName("");
            }}
          >
            Place Another Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Place an Order</h1>
        </div>
        <p className="text-muted-foreground">Browse available products and place your order below.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer">Your Name</Label>
        <Input
          id="customer"
          placeholder="Optional"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="space-y-3">
        <Label>Available Products</Label>
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
                      <span className="ml-2 text-amber-600 font-medium">Only {product.stock} left</span>
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
      </div>

      {totalItems > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalItems} item{totalItems !== 1 ? "s" : ""} selected
          </div>
          <div className="font-semibold font-mono">Est. ${estimatedTotal.toFixed(2)}</div>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={createOrder.isPending || totalItems === 0}
      >
        {createOrder.isPending ? "Placing Order…" : "Place Order"}
      </Button>
    </div>
  );
}
