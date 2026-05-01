import { useState, useEffect } from "react";
import { Settings2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminLock } from "@/components/AdminLock";
import { useAdminKey } from "@/contexts/AdminKeyContext";

type BusinessType = "restaurant" | "shop" | "service" | "";
type BusinessSubtype = "fastfood" | "cafe" | "pizza" | "";

function SetupForm() {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [type, setType] = useState<BusinessType>("");
  const [subtype, setSubtype] = useState<BusinessSubtype>("");
  const [name, setName] = useState("My Business");
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetch("/api/setup-business", {
      headers: { "x-admin-key": adminKey ?? "" },
    })
      .then((r) => r.json())
      .then((data) => {
        setType(data.type ?? "");
        setSubtype(data.subtype ?? "");
        setName(data.name ?? "My Business");
      })
      .catch(() => {});
  }, [adminKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await fetch("/api/setup-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey ?? "",
        },
        body: JSON.stringify({ type: type || null, subtype: subtype || null, name }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      toast({ title: "Business profile saved!" });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Business Setup</h1>
          <p className="text-muted-foreground text-sm">Configure how customers see your storefront</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Joe's Café"
            />
          </div>

          <div className="space-y-2">
            <Label>Business Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v as BusinessType); setSubtype(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                <SelectItem value="shop">🛍️ Shop</SelectItem>
                <SelectItem value="service">🔧 Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "restaurant" && (
            <div className="space-y-2">
              <Label>Restaurant Style</Label>
              <Select value={subtype} onValueChange={(v) => setSubtype(v as BusinessSubtype)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fastfood">🍔 Fast Food</SelectItem>
                  <SelectItem value="cafe">☕ Café</SelectItem>
                  <SelectItem value="pizza">🍕 Pizza</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2 font-medium">Customer preview</p>
          <p className="text-lg font-semibold">
            {type === "restaurant"
              ? `🍽️ Welcome to our ${subtype === "fastfood" ? "fast food" : subtype === "cafe" ? "café" : subtype === "pizza" ? "pizza" : ""} restaurant`
              : type === "shop"
              ? "🛍️ Welcome to our store"
              : type === "service"
              ? "🔧 Welcome to our service"
              : name}
          </p>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {saved ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save Setup</>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function SetupBusiness() {
  return (
    <AdminLock>
      <SetupForm />
    </AdminLock>
  );
}
