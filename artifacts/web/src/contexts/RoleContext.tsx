import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "customer" | "business" | null;

function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const val = getCookie("role");
    if (val === "customer" || val === "business") return val;
    return null;
  });

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      setCookie("role", newRole);
    } else {
      deleteCookie("role");
    }
  };

  const clearRole = () => setRole(null);

  useEffect(() => {
    const val = getCookie("role");
    const parsed: Role = val === "customer" || val === "business" ? val : null;
    setRoleState(parsed);
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
