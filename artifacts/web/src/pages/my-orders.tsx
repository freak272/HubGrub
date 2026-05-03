import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Phone, Search, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useBusinessTheme } from "@/hooks/useBusinessTheme";

type Order = {
  id: string;
  customer: string;
  phone?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  createdAt: string;
};

type BizProfile = {
  type: "restaurant" | "shop" | "service" | null;
  subtype: "fastfood" | "cafe" | "pizza" | null;
  name: string;
  description?: string;
  themeColor?: string;
  emoji?: string;
};

export default function MyOrders() {
  const { customer } = useAuth();
  const { businessCode, isDefaultBusiness } = useBusiness();
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [searchPhone, setSearchPhone] = useState(customer?.phone ?? "");
  const [searched, setSearched] = useState(!!customer?.phone);

  const profileUrl = isDefaultBusiness
    ? "/api/business-profile"
    : `/api/b/${businessCode}/profile`;

  const { data: bizProfile } = useQuery<BizProfile>({
    queryKey: ["biz-profile-myorders", businessCode],
    queryFn: () => fetch(profileUrl).then((r) => r.json()),
  });

  const theme = useBusinessTheme(bizProfile);

  const ordersUrl = isDefaultBusiness
    ? `/api/my-orders?phone=${encodeURIComponent(searchPhone)}`
    : `/api/b/${businessCode}/my-orders?phone=${encodeURIComponent(searchPhone)}`;

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["my-orders", businessCode, searchPhone],
    queryFn: () => fetch(ordersUrl).then((r) => r.json()),
    enabled: searched && !!searchPhone,
  });

  const handleSearch = () => {
    if (!phone.trim()) return;
    setSearchPhone(phone.trim());
    setSearched(true);
  };

  return (
    <div className="min-h-screen" style={{ background: theme.bgLight }}>
      {/* Hero */}
      <div className="px-8 py-10 text-center border-b" style={theme.heroStyle}>
        <div className="inline-flex h-14 w-14 rounded-full items-center justify-center text-3xl mb-4" style={theme.accentStyle}>
          {theme.emoji}
        </div>
        <h1 className="text-3xl font-bold">{bizProfile?.name ?? "Your Orders"}</h1>
        <p className="text-muted-foreground mt-1">Track your order history</p>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        {/* Phone lookup */}
        <div className="rounded-2xl border bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Phone size={16} />
            Look up your orders
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Phone Number</Label>
            <div className="flex gap-2">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +27 82 123 4567"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!phone.trim()} style={theme.buttonStyle}>
                <Search size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Looking up your orders…</div>
            ) : !orders || orders.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm text-muted-foreground mt-1">No orders are linked to {searchPhone}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground font-medium">{orders.length} order{orders.length !== 1 ? "s" : ""} found</p>
                {orders.map((order) => {
                  const statusInfo = theme.statusFlow[order.status] ?? { label: order.status, color: "#6b7280" };
                  return (
                    <div key={order.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b">
                        <div>
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-muted-foreground" />
                            <span className="font-mono text-xs text-muted-foreground">#{order.id.toUpperCase().slice(-6)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Clock size={12} />
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusInfo.color + "20", color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="px-5 py-3 divide-y">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between py-2 text-sm">
                            <span>{item.name} × {item.quantity}</span>
                            {item.price > 0 && <span className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>}
                          </div>
                        ))}
                      </div>
                      {order.total > 0 && (
                        <div className="flex justify-between px-5 py-3 border-t text-sm font-semibold">
                          <span>Total</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
