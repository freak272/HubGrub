import { createContext, useContext, useState, type ReactNode } from "react";

export type CustomerProfile = {
  name: string;
  contact: string;
};

interface AuthContextValue {
  customer: CustomerProfile | null;
  loginCustomer: (name: string, contact: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "wh_customer_profile";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const loginCustomer = (name: string, contact: string) => {
    const profile: CustomerProfile = { name: name.trim() || "Guest", contact: contact.trim() };
    setCustomer(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ customer, loginCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
