import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { OrderStatus } from "@/lib/storage";

const META: Record<
  OrderStatus,
  { label: string; bg: string; fg: string }
> = {
  NEW: { label: "New", bg: "#dbeafe", fg: "#1d4ed8" },
  PACKED: { label: "Packed", bg: "#fef3c7", fg: "#92400e" },
  SHIPPED: { label: "Shipped", bg: "#ede9fe", fg: "#6d28d9" },
  DELIVERED: { label: "Delivered", bg: "#d1fae5", fg: "#047857" },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  useColors();
  const m = META[status];
  return (
    <View style={[styles.pill, { backgroundColor: m.bg }]}>
      <View style={[styles.dot, { backgroundColor: m.fg }]} />
      <Text style={[styles.text, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
