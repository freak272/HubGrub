import { useState } from "react";
import { 
  useListOrders, 
  getListOrdersQueryKey, 
  useCreateOrder, 
  useAdvanceOrder,
  useListProducts,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { AdminLock } from "@/components/AdminLock";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRight, Package, Clock, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function OrdersContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { data: orders, isLoading: ordersLoading } = useListOrders({ query: { queryKey: getListOrdersQueryKey() } });
  const { data: products } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  
  const createOrder = useCreateOrder();
  const advanceOrder = useAdvanceOrder();

  const handleCreateOrder = () => {
    const items = Object.entries(selectedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (items.length === 0) {
      toast({ title: "Error", description: "Select at least one product.", variant: "destructive" });
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
        }
      }
    );
  };

  const handleAdvance = (id: string, currentStatus: string) => {
    advanceOrder.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Order status updated" });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setSelectedItems(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(current + delta, maxStock));
      return { ...prev, [productId]: next };
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock size={12} className="mr-1"/> NEW</Badge>;
      case 'PACKED': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Package size={12} className="mr-1"/> PACKED</Badge>;
      case 'SHIPPED': return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100"><Truck size={12} className="mr-1"/> SHIPPED</Badge>;
      case 'DELIVERED': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 size={12} className="mr-1"/> DELIVERED</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Track and fulfill customer orders.</p>
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
                          -
                        </Button>
                        <span className="w-6 text-center text-sm font-mono">{selectedItems[product.id] || 0}</span>
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
                disabled={createOrder.isPending || Object.values(selectedItems).every(v => v === 0)}
              >
                {createOrder.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm">
        {ordersLoading ? (
          <div className="p-4 space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground text-sm">Create a new order to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">{order.customer || 'Guest'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status !== 'DELIVERED' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 gap-1"
                        onClick={() => handleAdvance(order.id, order.status)}
                        disabled={advanceOrder.isPending}
                      >
                        Advance <ArrowRight size={14} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
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
