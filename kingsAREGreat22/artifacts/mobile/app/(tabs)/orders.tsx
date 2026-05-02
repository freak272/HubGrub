import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { NewOrderSheet } from "@/components/NewOrderSheet";
import { StatusPill } from "@/components/StatusPill";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/contexts/StoreContext";
import type { Order, OrderStatus } from "@/lib/storage";

const FILTERS: Array<{ key: "ALL" | OrderStatus; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, advanceOrder, deleteOrder } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const revenue = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((s, o) => s + o.total, 0);
  const openCount = orders.filter((o) => o.status !== "DELIVERED").length;

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? 84 + 16 : (insets.bottom || 0) + 70;

  function handleDelete(o: Order) {
    Alert.alert("Delete order?", `Order #${o.id.slice(-6).toUpperCase()} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteOrder(o.id),
      },
    ]);
  }

  function handleAdvance(o: Order) {
    if (o.status === "DELIVERED") return;
    advanceOrder(o.id);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{
          paddingTop: topInset + 8,
          paddingBottom: bottomInset,
          paddingHorizontal: 16,
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text
                  style={[styles.eyebrow, { color: colors.mutedForeground }]}
                >
                  ORDERS
                </Text>
                <Text style={[styles.h1, { color: colors.foreground }]}>
                  {openCount}{" "}
                  <Text style={{ color: colors.mutedForeground }}>open</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setSheetOpen(true)}
                style={({ pressed }) => [
                  styles.addBtn,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="plus" size={20} color={colors.accentForeground} />
              </Pressable>
            </View>

            <View
              style={[
                styles.revenueCard,
                {
                  backgroundColor: colors.foreground,
                },
              ]}
            >
              <View>
                <Text
                  style={[styles.revenueLabel, { color: "rgba(255,255,255,0.6)" }]}
                >
                  Delivered revenue
                </Text>
                <Text
                  style={[styles.revenueValue, { color: colors.background }]}
                >
                  ${revenue.toFixed(2)}
                </Text>
              </View>
              <View style={styles.revenueIcon}>
                <Feather name="trending-up" size={22} color={colors.accent} />
              </View>
            </View>

            <FlatList
              data={FILTERS}
              keyExtractor={(f) => f.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              style={{ marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 12 }}
              renderItem={({ item }) => {
                const active = filter === item.key;
                return (
                  <Pressable
                    onPress={() => setFilter(item.key)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.foreground : colors.card,
                        borderColor: active ? colors.foreground : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: active
                            ? colors.background
                            : colors.foreground,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAdvance={() => handleAdvance(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          orders.length === 0 ? (
            <EmptyState
              icon="clipboard"
              title="No orders yet"
              subtitle="Tap the + button to create your first order from inventory."
            />
          ) : (
            <EmptyState
              icon="filter"
              title="Nothing here"
              subtitle="No orders match this filter."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <NewOrderSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

function OrderCard({
  order,
  onAdvance,
  onDelete,
}: {
  order: Order;
  onAdvance: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const date = new Date(order.createdAt);
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const day = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const isDone = order.status === "DELIVERED";

  return (
    <View
      style={[
        styles.orderCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.orderTitleRow}>
            <Text style={[styles.orderId, { color: colors.foreground }]}>
              #{order.id.slice(-6).toUpperCase()}
            </Text>
            <StatusPill status={order.status} />
          </View>
          <Text
            style={[styles.orderCustomer, { color: colors.mutedForeground }]}
          >
            {order.customer} · {day} at {time}
          </Text>
        </View>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={[styles.itemsBox, { borderColor: colors.border }]}>
        {order.items.slice(0, 3).map((it) => (
          <View key={it.productId} style={styles.itemRow}>
            <Text
              style={[styles.itemQty, { color: colors.mutedForeground }]}
            >
              ×{it.quantity}
            </Text>
            <Text
              style={[styles.itemName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {it.name}
            </Text>
            <Text style={[styles.itemPrice, { color: colors.foreground }]}>
              ${(it.price * it.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        {order.items.length > 3 ? (
          <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
            +{order.items.length - 3} more
          </Text>
        ) : null}
      </View>

      <View style={styles.orderBottom}>
        <View>
          <Text
            style={[styles.totalLabel, { color: colors.mutedForeground }]}
          >
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>
            ${order.total.toFixed(2)}
          </Text>
        </View>
        <Pressable
          onPress={onAdvance}
          disabled={isDone}
          style={({ pressed }) => [
            styles.advanceBtn,
            {
              backgroundColor: isDone ? colors.muted : colors.foreground,
              opacity: isDone ? 1 : pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.advanceText,
              { color: isDone ? colors.mutedForeground : colors.background },
            ]}
          >
            {isDone ? "Completed" : "Advance"}
          </Text>
          {!isDone ? (
            <Feather name="arrow-right" size={14} color={colors.background} />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  h1: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  revenueCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  revenueLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  revenueIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  orderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  orderCustomer: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    padding: 4,
  },
  itemsBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  itemQty: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  moreText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    paddingTop: 2,
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  advanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
  },
  advanceText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
