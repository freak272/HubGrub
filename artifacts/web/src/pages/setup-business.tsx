import { useState, useEffect } from "react";
import { Settings2, Save, CheckCircle2, Link2, Copy, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useBusinessTheme } from "@/hooks/useBusinessTheme";

type BusinessType = "restaurant" | "shop" | "service" | "";
type BusinessSubtype = "fastfood" | "cafe" | "pizza" | "";

const THEME_COLORS = [
  { value: "amber",  label: "Amber",  hex: "#d97706" },
  { value: "red",    label: "Red",    hex: "#dc2626" },
  { value: "orange", label: "Orange", hex: "#ea580c" },
  { value: "blue",   label: "Blue",   hex: "#2563eb" },
  { value: "green",  label: "Green",  hex: "#16a34a" },
  { value: "purple", label: "Purple", hex: "#7c3aed" },
];

function SetupForm() {
  const { adminKey } = useAdminKey();
  const { toast } = useToast();
  const [type, setType] = useState<BusinessType>("");
  const [subtype, setSubtype] = useState<BusinessSubtype>("");
  const [name, setName] = useState("My Business");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("amber");
  const [emoji, setEmoji] = useState("");
  const [bizCode, setBizCode] = useState("DEFAULT");
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const theme = useBusinessTheme({
    type: type as "restaurant" | "shop" | "service" | null,
    subtype: subtype as "fastfood" | "cafe" | "pizza" | null,
    name,
    description,
    themeColor,
    emoji,
  });

  useEffect(() => {
    fetch("/api/setup-business", { headers: { "x-admin-key": adminKey ?? "" } })
      .then((r) => r.json())
      .then((data) => {
        setType(data.type ?? "");
        setSubtype(data.subtype ?? "");
        setName(data.name ?? "My Business");
        setDescription(data.description ?? "");
        setThemeColor(data.themeColor ?? "amber");
        setEmoji(data.emoji ?? "");
        setBizCode(data.code ?? "DEFAULT");
      })
      .catch(() => {});
  }, [adminKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await fetch("/api/setup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey ?? "" },
        body: JSON.stringify({ type: type || null, subtype: subtype || null, name, description, themeColor, emoji }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      toast({ title: "Business profile saved!" });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsPending(false); }
  };

  const customerLink = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const copyLink = () => {
    navigator.clipboard.writeText(customerLink).then(() => toast({ title: "Link copied!" }));
  };
  const copyCode = () => {
    navigator.clipboard.writeText(bizCode).then(() => toast({ title: "Code copied!" }));
  };

  return (
    <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Business Setup</h1>
          <p className="text-muted-foreground text-sm">Configure how customers see your storefront</p>
        </div>
      </div>

      {/* Shareable link card */}
      <div className="rounded-xl border bg-card p-5 mb-6 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Link2 size={15} />
          Your Customer Access
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md text-xs font-mono truncate">{customerLink}</div>
            <button
              onClick={copyLink}
              className="shrink-0 px-3 py-2 border rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Copy size={12} /> Copy link
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">Business code:</div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-widest px-2.5 py-1 rounded-md" style={theme.accentStyle}>{bizCode}</span>
            <button onClick={copyCode} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Copy size={12} />
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Share this link or code with your customers so they can order from you.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Business Info</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Joe's Café" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Short Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Specialty coffee & pastries. Open 7am–7pm daily."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={type} onValueChange={(v) => { setType(v as BusinessType); setSubtype(""); }}>
                <SelectTrigger><SelectValue placeholder="Select a type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                  <SelectItem value="shop">🛍️ Shop</SelectItem>
                  <SelectItem value="service">🔧 Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "restaurant" && (
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={subtype} onValueChange={(v) => setSubtype(v as BusinessSubtype)}>
                  <SelectTrigger><SelectValue placeholder="Select style..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fastfood">🍔 Fast Food</SelectItem>
                    <SelectItem value="cafe">☕ Café</SelectItem>
                    <SelectItem value="pizza">🍕 Pizza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emoji">Custom Emoji / Icon</Label>
            <Input id="emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="e.g. ☕ or leave blank for auto" className="w-24" maxLength={4} />
          </div>
        </div>

        {/* Theme color picker */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} />
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Brand Color</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setThemeColor(c.value)}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="h-10 w-10 rounded-full border-4 transition-all"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: themeColor === c.value ? c.hex : "transparent",
                    outline: themeColor === c.value ? `2px solid ${c.hex}` : "2px solid transparent",
                    outlineOffset: "2px",
                  }}
                />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Customer preview</p>
          <div className="rounded-lg border overflow-hidden" style={theme.heroStyle}>
            <div className="p-5 flex items-center gap-4">
              <span className="text-4xl">{theme.emoji}</span>
              <div>
                <div className="font-bold text-xl">{name || "My Business"}</div>
                {description && <div className="text-sm text-muted-foreground mt-0.5">{description}</div>}
                <div className="text-sm text-muted-foreground mt-1">{theme.orderPrompt}</div>
              </div>
            </div>
            <div className="px-5 pb-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={theme.accentStyle}>{theme.catalogLabel}</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={theme.accentStyle}>{theme.orderVerb}</span>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full" style={theme.buttonStyle}>
          {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Saved!</> : <><Save className="h-4 w-4 mr-2" /> Save Setup</>}
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
