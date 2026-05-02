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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddProductSheet } from "@/components/AddProductSheet";
import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";
import { useStore } from "@/contexts/StoreContext";
import type { Product } from "@/lib/storage";

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, updateProductStock, deleteProduct } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [products, search]);

  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? 84 + 16 : (insets.bottom || 0) + 70;

  function handleDelete(p: Product) {
    Alert.alert("Delete product?", `${p.name} will be removed from inventory.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteProduct(p.id),
      },
    ]);
  }

  function handleAdjust(p: Product, delta: number) {
    if (delta < 0 && p.stock === 0) return;
    updateProductStock(p.id, delta);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
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
                  INVENTORY
                </Text>
                <Text style={[styles.h1, { color: colors.foreground }]}>
                  {products.length}{" "}
                  <Text style={{ color: colors.mutedForeground }}>
                    {products.length === 1 ? "product" : "products"}
                  </Text>
                </Text>
              </View>
              <Pressable
                onPress={() => setSheetOpen(true)}
                style={({ pressed }) => [
                  styles.addBtn,
                  {
                    backgroundColor: colors.foreground,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="plus" size={20} color={colors.background} />
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label="Stock value"
                value={`$${totalValue.toFixed(2)}`}
                accent={colors.accent}
              />
              <StatCard
                label="Low stock"
                value={String(lowStock)}
                accent={colors.warning}
              />
              <StatCard
                label="Out"
                value={String(outOfStock)}
                accent={colors.destructive}
              />
            </View>

            {products.length > 0 ? (
              <View
                style={[
                  styles.searchWrap,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather
                  name="search"
                  size={16}
                  color={colors.mutedForeground}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search products or SKU"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
                {search.length > 0 ? (
                  <Pressable onPress={() => setSearch("")} hitSlop={8}>
                    <Feather
                      name="x-circle"
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onAdjust={(d) => handleAdjust(item, d)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          products.length === 0 ? (
            <EmptyState
              icon="package"
              title="Inventory is empty"
              subtitle="Add your first product to start tracking stock and creating orders."
            />
          ) : (
            <EmptyState
              icon="search"
              title="No matches"
              subtitle="Try a different name or SKU."
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <AddProductSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statBar, { backgroundColor: accent }]} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function ProductRow({
  product,
  onAdjust,
  onDelete,
}: {
  product: Product;
  onAdjust: (delta: number) => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const stockColor =
    product.stock === 0
      ? colors.destructive
      : product.stock <= 5
        ? colors.warning
        : colors.success;

  return (
    <View
      style={[
        styles.productCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.productTop}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.productName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text style={[styles.productSku, { color: colors.mutedForeground }]}>
            {product.sku} · ${product.price.toFixed(2)}
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
      <View style={styles.productBottom}>
        <View style={styles.stockWrap}>
          <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
          <Text style={[styles.stockText, { color: colors.foreground }]}>
            {product.stock}
          </Text>
          <Text style={[styles.stockLabel, { color: colors.mutedForeground }]}>
            in stock
          </Text>
        </View>
        <View style={styles.adjustWrap}>
          <Pressable
            onPress={() => onAdjust(-1)}
            disabled={product.stock === 0}
            style={({ pressed }) => [
              styles.adjustBtn,
              {
                backgroundColor: colors.muted,
                opacity: product.stock === 0 ? 0.4 : pressed ? 0.6 : 1,
              },
            ]}
          >
            <Feather name="minus" size={14} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => onAdjust(+1)}
            style={({ pressed }) => [
              styles.adjustBtn,
              {
                backgroundColor: colors.foreground,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="plus" size={14} color={colors.background} />
          </Pressable>
        </View>
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  statBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  productCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  productTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  productSku: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    padding: 4,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  stockLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginLeft: 2,
  },
  adjustWrap: {
    flexDirection: "row",
    gap: 8,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
