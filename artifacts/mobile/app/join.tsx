import { useMemo, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const COUNTRIES = ["+1", "+44", "+91", "+61"];

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const { width, height } = useWindowDimensions();
  const merchantId = typeof params.id === "string" ? params.id.toUpperCase() : "";
  const businessName = typeof params.name === "string" ? params.name : merchantId || "Foodie";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [loading, setLoading] = useState(false);
  const hasMerchant = merchantId.length > 0;

  const logoSize = useMemo(() => Math.min(width * 0.52, 220), [width]);
  const topPanelHeight = Math.max(height * 0.3, 220);

  async function handleRegister() {
    setLoading(true);
    setTimeout(() => {
      router.replace(`/shop/${hasMerchant ? merchantId : "home"}`);
    }, 1200);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={[styles.hero, { height: topPanelHeight }]}>
          <BlurView intensity={32} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.heroInner}>
            {hasMerchant ? (
              <View style={styles.logoCard}>
                <Text style={styles.logoText}>{businessName.slice(0, 1)}</Text>
                <Text style={styles.brandName} numberOfLines={1}>{businessName}</Text>
              </View>
            ) : (
              <View style={[styles.foodieWrap, { width: logoSize, height: logoSize }]}>
                <View style={styles.foodieCircle}>
                  <Feather name="coffee" size={42} color="#0F172A" />
                  <Text style={styles.foodieTitle}>Foodie</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.kicker}>Welcome to {businessName}</Text>
          <Text style={styles.subtitle}>Create your profile to continue.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputShell}>
              <TextInput value={fullName} onChangeText={setFullName} placeholder="Jane Smith" placeholderTextColor="#94A3B8" style={styles.input} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <Pressable style={styles.countryPicker}>
                <Text style={styles.countryText}>{country}</Text>
                <Feather name="chevron-down" size={16} color="#334155" />
              </Pressable>
              <View style={[styles.inputShell, styles.phoneInputShell]}>
                <TextInput value={phone} onChangeText={setPhone} placeholder="555 123 4567" placeholderTextColor="#94A3B8" keyboardType="phone-pad" style={styles.input} />
              </View>
            </View>
          </View>

          <Pressable onPress={handleRegister} style={({ pressed }) => [styles.cta, pressed && !loading ? { transform: [{ scale: 0.99 }] } : null]} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Send OTP</Text>}
          </Pressable>

          <Text style={styles.caption}>Your profile stays with you. Scan any partner restaurant to add them to your app instantly.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.loadingTitle}>Unlocking storefront…</Text>
              <Text style={styles.loadingText}>Taking you to {businessName}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  hero: {
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.18)",
  },
  heroInner: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  logoCard: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoText: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.85)",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 36,
    fontWeight: "700",
    color: "#0F172A",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  brandName: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  foodieWrap: { alignItems: "center", justifyContent: "center" },
  foodieCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    gap: 10,
  },
  foodieTitle: { fontSize: 22, fontWeight: "700", color: "#0F172A" },
  card: {
    flex: 1,
    marginTop: -18,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 16,
  },
  kicker: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#475569", marginTop: -8 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#334155" },
  inputShell: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
  },
  input: { fontSize: 16, color: "#0F172A" },
  phoneRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  countryPicker: {
    minWidth: 84,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  countryText: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  phoneInputShell: { flex: 1 },
  cta: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EA580C",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    marginTop: 4,
  },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  caption: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4, lineHeight: 18 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.22)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  loadingTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  loadingText: { fontSize: 13, color: "#475569" },
});