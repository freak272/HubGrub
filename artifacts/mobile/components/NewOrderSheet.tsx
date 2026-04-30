import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/contexts/StoreContext";
import type { OrderItem } from "@/lib/storage";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NewOrderSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, createOrder } = useStore();
  const [customer, setCustomer] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});

  const items = useMemo<OrderItem[]>(() => {
    return Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => {
        const p = products.find((x) => x.id === id);
        if (!p) return null;
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: q,
        };
      })
      .filter((x): x is OrderItem => x !== null);
  }, [qty, products]);

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  function setQuantity(id: string, max: number, delta: number) {
    setQty((prev) => {
      const cur = prev[id] ?? 0;
      const next = Math.max(0, Math.min(max, cur + delta));
      return { ...prev, [id]: next };
    });
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  }

  function reset() {
    setCustomer("");
    setQty({});
  }

  function handleCreate() {
    if (items.length === 0) return;
    const order = createOrder({ customer, items });
    if (order) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      reset();
      onClose();
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingTop: 10,
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              New Order
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.customerRow}>
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              value={customer}
              onChangeText={setCustomer}
              placeholder="Customer name (optional)"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.customerInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
          </View>

          <ScrollView
            style={{ maxHeight: 360 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {products.length === 0 ? (
              <EmptyState
                icon="package"
                title="No products yet"
                subtitle="Add products to your inventory before creating an order."
              />
            ) : (
              products.map((p) => {
                const q = qty[p.id] ?? 0;
                const disabled = p.stock === 0;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.productRow,
                      { borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.productName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                      <Text
                        style={[
                          styles.productMeta,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        ${p.price.toFixed(2)} · {p.stock} in stock
                      </Text>
                    </View>
                    <View style={styles.qtyWrap}>
                      <Pressable
                        onPress={() => setQuantity(p.id, p.stock, -1)}
                        disabled={q === 0}
                        style={({ pressed }) => [
                          styles.qtyBtn,
                          {
                            backgroundColor: colors.muted,
                            opacity: q === 0 ? 0.4 : pressed ? 0.6 : 1,
                          },
                        ]}
                      >
                        <Feather name="minus" size={14} color={colors.foreground} />
                      </Pressable>
                      <Text
                        style={[styles.qtyText, { color: colors.foreground }]}
                      >
                        {q}
                      </Text>
                      <Pressable
                        onPress={() => setQuantity(p.id, p.stock, +1)}
                        disabled={disabled || q >= p.stock}
                        style={({ pressed }) => [
                          styles.qtyBtn,
                          {
                            backgroundColor: colors.foreground,
                            opacity:
                              disabled || q >= p.stock
                                ? 0.3
                                : pressed
                                  ? 0.7
                                  : 1,
                          },
                        ]}
                      >
                        <Feather
                          name="plus"
                          size={14}
                          color={colors.background}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.totalRow}>
              <Text
                style={[styles.totalLabel, { color: colors.mutedForeground }]}
              >
                Total · {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
              <Text style={[styles.totalAmount, { color: colors.foreground }]}>
                ${total.toFixed(2)}
              </Text>
            </View>
            <Pressable
              onPress={handleCreate}
              disabled={items.length === 0}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: colors.accent,
                  opacity:
                    items.length === 0 ? 0.4 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather
                name="check"
                size={18}
                color={colors.accentForeground}
              />
              <Text
                style={[styles.ctaText, { color: colors.accentForeground }]}
              >
                Create Order
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#d4d4d8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  customerInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  productMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    minWidth: 18,
    textAlign: "center",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  cta: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
