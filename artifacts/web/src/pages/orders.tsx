import { useState } from "react";
import {
  useListOrders,
  getListOrdersQueryKey,
  useCreateOrder,
  useAdvanceOrder,
  useListProducts,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { AdminLock } from "@/components/AdminLock";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRight, Package, Clock, Truck, CheckCircle2, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; icon: React.ReactNode }> = {
  NEW:       { label: "NEW",       color: "text-blue-700",   border: "border-blue-300",   icon: <Clock size={14} /> },
  PACKED:    { label: "PACKED",    color: "text-yellow-700", border: "border-yellow-300", icon: <Package size={14} /> },
  SHIPPED:   { label: "SHIPPED",   color: "text-purple-700", border: "border-purple-300", icon: <Truck size={14} /> },
  DELIVERED: { label: "DELIVERED", color: "text-green-700",  border: "border-green-300",  icon: <CheckCircle2 size={14} /> },
};

function OrdersContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { data: orders, isLoading: ordersLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey(), refetchInterval: 3000 },
  });
  const { data: products } = useListProducts({
    query: { queryKey: getListProductsQueryKey() },
  });

  const productMap = Object.fromEntries((products ?? []).map((p) => [p.id, p]));

  const createOrder = useCreateOrder();
  const advanceOrder = useAdvanceOrder();

  const handleCreateOrder = () => {
    const items = Object.entries(selectedItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      toast({ title: "Select at least one product.", variant: "destructive" });
      return;
    }

    createOrder.mutate(
      { data: { customer: customerName || "Guest", items } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setIsAddOpen(false);
          setSelectedItems({});
          setCustomerName("");
          toast({ title: "Order created successfully" });
        },
        onError: () => {
          toast({ title: "Failed to create order", variant: "destructive" });
        },
      }
    );
  };

  const handleAdvance = (id: string) => {
    advanceOrder.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order status updated" });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        },
      }
    );
  };

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setSelectedItems((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(current + delta, maxStock));
      return { ...prev, [productId]: next };
    });
  };

  const formatItems = (items: Array<{ productId: string; quantity: number; name?: string }>) =>
    items
      .map(({ productId, quantity, name }) => {
        const display = name || productMap[productId]?.name || productId;
        return quantity > 1 ? `${display} ×${quantity}` : display;
      })
      .join(", ");

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Tv2 className="h-7 w-7 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Live Orders</h1>
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {orders?.length ?? 0} order{orders?.length !== 1 ? "s" : ""} · refreshes every 3s
            </p>
          </div>
        </div>

        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              New Order
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md w-full overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Create New Order</SheetTitle>
            </SheetHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-3">
                <Label>Select Products</Label>
                <div className="border rounded-md divide-y">
                  {products?.map((product) => (
                    <div key={product.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {product.sku} · ${product.price.toFixed(2)} · Stock: {product.stock}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(product.id, -1, product.stock)}
                          disabled={(selectedItems[product.id] || 0) <= 0}
                        >
                          −
                        </Button>
                        <span className="w-6 text-center text-sm font-mono">
                          {selectedItems[product.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(product.id, 1, product.stock)}
                          disabled={(selectedItems[product.id] || 0) >= product.stock}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!products || products.length === 0) && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No products available in inventory.
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCreateOrder}
                disabled={
                  createOrder.isPending ||
                  Object.values(selectedItems).every((v) => v === 0)
                }
              >
                {createOrder.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {ordersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">No orders yet</h3>
          <p className="text-muted-foreground text-sm">
            Create a new order or wait for customers to place one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order, index) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
            return (
              <div
                key={order.id}
                className={`rounded-lg border-2 ${cfg.border} bg-card p-5 flex flex-col gap-3 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Order #{index + 1}
                    </span>
                    <div className="font-semibold mt-0.5">{order.customer || "Guest"}</div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${cfg.border} ${cfg.color} bg-white`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {formatItems(order.items)}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="font-mono text-sm font-semibold">
                    ${order.total.toFixed(2)}
                  </span>
                  {order.status !== "DELIVERED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      onClick={() => handleAdvance(order.id)}
                      disabled={advanceOrder.isPending}
                    >
                      Advance <ArrowRight size={12} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  return (
    <AdminLock>
      <OrdersContent />
    </AdminLock>
  );
}
