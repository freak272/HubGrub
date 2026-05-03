import { useMemo } from "react";

export type BusinessProfile = {
  type: "restaurant" | "shop" | "service" | null;
  subtype: "fastfood" | "cafe" | "pizza" | null;
  name: string;
  description?: string;
  themeColor?: string;
  emoji?: string;
};

export type BusinessTheme = {
  primaryHex: string;
  bgLight: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  productLabel: string;
  catalogLabel: string;
  browseLabel: string;
  orderVerb: string;
  orderPrompt: string;
  searchPlaceholder: string;
  greeting: string;
  emoji: string;
  statusFlow: Record<string, { label: string; color: string }>;
  heroStyle: React.CSSProperties;
  accentStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
};

const PALETTES: Record<string, { hex: string; light: string; border: string; badgeBg: string; badgeText: string }> = {
  amber:  { hex: "#d97706", light: "#fffbeb", border: "#fde68a", badgeBg: "#fef3c7", badgeText: "#92400e" },
  red:    { hex: "#dc2626", light: "#fff1f2", border: "#fecaca", badgeBg: "#fee2e2", badgeText: "#991b1b" },
  blue:   { hex: "#2563eb", light: "#eff6ff", border: "#bfdbfe", badgeBg: "#dbeafe", badgeText: "#1e40af" },
  green:  { hex: "#16a34a", light: "#f0fdf4", border: "#bbf7d0", badgeBg: "#dcfce7", badgeText: "#166534" },
  purple: { hex: "#7c3aed", light: "#faf5ff", border: "#ddd6fe", badgeBg: "#ede9fe", badgeText: "#5b21b6" },
  orange: { hex: "#ea580c", light: "#fff7ed", border: "#fed7aa", badgeBg: "#ffedd5", badgeText: "#9a3412" },
  default:{ hex: "#6366f1", light: "#eef2ff", border: "#c7d2fe", badgeBg: "#e0e7ff", badgeText: "#3730a3" },
};

function getPalette(themeColor?: string) {
  return PALETTES[themeColor ?? "default"] ?? PALETTES.default;
}

function deriveThemeColor(type: string | null, subtype: string | null, explicit?: string): string {
  if (explicit && PALETTES[explicit]) return explicit;
  if (type === "restaurant") {
    if (subtype === "fastfood") return "red";
    if (subtype === "cafe") return "amber";
    if (subtype === "pizza") return "red";
    return "orange";
  }
  if (type === "shop") return "blue";
  if (type === "service") return "green";
  return "default";
}

function deriveEmoji(type: string | null, subtype: string | null, explicit?: string): string {
  if (explicit) return explicit;
  if (type === "restaurant") {
    if (subtype === "fastfood") return "🍔";
    if (subtype === "cafe") return "☕";
    if (subtype === "pizza") return "🍕";
    return "🍽️";
  }
  if (type === "shop") return "🛍️";
  if (type === "service") return "🔧";
  return "🏪";
}

function deriveVocabulary(type: string | null, subtype: string | null) {
  if (type === "restaurant") {
    const isCafe = subtype === "cafe";
    return {
      productLabel: isCafe ? "Drink or Food Item" : "Menu Item",
      catalogLabel: isCafe ? "Menu" : "Menu",
      browseLabel: "Browse Menu",
      orderVerb: "Order Now",
      orderPrompt: isCafe ? "What can we make for you?" : "What would you like to eat?",
      searchPlaceholder: isCafe ? "e.g. Flat White, Croissant x2" : "e.g. Margherita x2, Garlic Bread",
    };
  }
  if (type === "shop") {
    return {
      productLabel: "Product",
      catalogLabel: "Catalog",
      browseLabel: "Browse Catalog",
      orderVerb: "Add to Cart",
      orderPrompt: "What are you looking for today?",
      searchPlaceholder: "e.g. Blue T-Shirt x2, Size M",
    };
  }
  if (type === "service") {
    return {
      productLabel: "Service",
      catalogLabel: "Services",
      browseLabel: "Browse Services",
      orderVerb: "Book Now",
      orderPrompt: "What service do you need?",
      searchPlaceholder: "e.g. Screen Replacement, Battery x1",
    };
  }
  return {
    productLabel: "Item",
    catalogLabel: "Catalog",
    browseLabel: "Browse Products",
    orderVerb: "Place Order",
    orderPrompt: "What would you like?",
    searchPlaceholder: "e.g. Item x2, Another Item",
  };
}

function deriveGreeting(type: string | null, subtype: string | null, name: string, emoji: string): string {
  if (type === "restaurant") {
    if (subtype === "fastfood") return `${emoji} Order from ${name}`;
    if (subtype === "cafe") return `${emoji} Welcome to ${name}`;
    if (subtype === "pizza") return `${emoji} Order from ${name}`;
    return `${emoji} Welcome to ${name}`;
  }
  if (type === "shop") return `${emoji} Shop at ${name}`;
  if (type === "service") return `${emoji} Book a Service at ${name}`;
  return `${emoji} ${name}`;
}

const STATUS_FLOWS: Record<string, Record<string, { label: string; color: string }>> = {
  restaurant: {
    NEW:       { label: "Order Received",  color: "#f59e0b" },
    PACKED:    { label: "Being Prepared",  color: "#3b82f6" },
    SHIPPED:   { label: "Ready to Collect",color: "#8b5cf6" },
    DELIVERED: { label: "Served ✓",        color: "#16a34a" },
  },
  shop: {
    NEW:       { label: "Order Placed",    color: "#f59e0b" },
    PACKED:    { label: "Packed",          color: "#3b82f6" },
    SHIPPED:   { label: "Out for Delivery",color: "#8b5cf6" },
    DELIVERED: { label: "Delivered ✓",    color: "#16a34a" },
  },
  service: {
    NEW:       { label: "Booking Received",color: "#f59e0b" },
    PACKED:    { label: "In Progress",     color: "#3b82f6" },
    SHIPPED:   { label: "Ready",           color: "#8b5cf6" },
    DELIVERED: { label: "Completed ✓",    color: "#16a34a" },
  },
  default: {
    NEW:       { label: "New",             color: "#f59e0b" },
    PACKED:    { label: "Packed",          color: "#3b82f6" },
    SHIPPED:   { label: "Shipped",         color: "#8b5cf6" },
    DELIVERED: { label: "Delivered ✓",    color: "#16a34a" },
  },
};

export function useBusinessTheme(profile: BusinessProfile | null | undefined): BusinessTheme {
  return useMemo(() => {
    const type = profile?.type ?? null;
    const subtype = profile?.subtype ?? null;
    const name = profile?.name ?? "Business";
    const colorKey = deriveThemeColor(type, subtype, profile?.themeColor);
    const palette = getPalette(colorKey);
    const emoji = deriveEmoji(type, subtype, profile?.emoji);
    const vocab = deriveVocabulary(type, subtype);
    const greeting = deriveGreeting(type, subtype, name, emoji);
    const statusFlow = STATUS_FLOWS[type ?? "default"] ?? STATUS_FLOWS.default;

    return {
      primaryHex: palette.hex,
      bgLight: palette.light,
      borderColor: palette.border,
      badgeBg: palette.badgeBg,
      badgeText: palette.badgeText,
      emoji,
      greeting,
      statusFlow,
      ...vocab,
      heroStyle: {
        background: `linear-gradient(135deg, ${palette.light} 0%, white 100%)`,
        borderBottom: `1px solid ${palette.border}`,
      },
      accentStyle: {
        backgroundColor: palette.badgeBg,
        color: palette.badgeText,
        border: `1px solid ${palette.border}`,
      },
      buttonStyle: {
        backgroundColor: palette.hex,
        color: "white",
      },
    };
  }, [profile]);
}
