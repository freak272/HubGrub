import AsyncStorage from "@react-native-async-storage/async-storage";

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  createdAt: number;
};

export type OrderStatus = "NEW" | "PACKED" | "SHIPPED" | "DELIVERED";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customer: string;
  createdAt: number;
};

const PRODUCTS_KEY = "@od/products/v1";
const ORDERS_KEY = "@od/orders/v1";

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function loadProducts(): Promise<Product[]> {
  const raw = await AsyncStorage.getItem(PRODUCTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

export async function saveProducts(items: Product[]): Promise<void> {
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));
}

export async function loadOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export async function saveOrders(items: Order[]): Promise<void> {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(items));
}

export const STATUS_FLOW: OrderStatus[] = [
  "NEW",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

export function nextStatus(s: OrderStatus): OrderStatus {
  const i = STATUS_FLOW.indexOf(s);
  return STATUS_FLOW[Math.min(i + 1, STATUS_FLOW.length - 1)] ?? s;
}
