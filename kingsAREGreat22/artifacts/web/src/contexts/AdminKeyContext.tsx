import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setAdminKey } from "@workspace/api-client-react";

const STORAGE_KEY = "wh_admin_key";

interface AdminKeyContextValue {
  adminKey: string | null;
  isUnlocked: boolean;
  unlock: (key: string) => void;
  lock: () => void;
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null);

export function AdminKeyProvider({ children }: { children: ReactNode }) {
  const [adminKey, setKey] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    setAdminKey(adminKey);
    if (adminKey) {
      localStorage.setItem(STORAGE_KEY, adminKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [adminKey]);

  const unlock = (key: string) => setKey(key);
  const lock = () => setKey(null);

  return (
    <AdminKeyContext.Provider value={{ adminKey, isUnlocked: !!adminKey, unlock, lock }}>
      {children}
    </AdminKeyContext.Provider>
  );
}

export function useAdminKey() {
  const ctx = useContext(AdminKeyContext);
  if (!ctx) throw new Error("useAdminKey must be used within AdminKeyProvider");
  return ctx;
}
