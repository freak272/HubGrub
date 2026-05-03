import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CustomerBusiness = {
  code: string;
  name: string;
  emoji?: string | null;
};

interface BusinessContextValue {
  activeBusinessCode: string | null;
  customerBusinesses: CustomerBusiness[];
  setActiveBusinessCode: (code: string | null) => void;
  addCustomerBusiness: (biz: CustomerBusiness) => void;
  isDefaultBusiness: boolean;
}

const ACTIVE_KEY = "wh_active_business_code";
const CUSTOMER_BUSINESSES_KEY = "wh_customer_businesses";

const BusinessContext = createContext<BusinessContextValue | null>(null);

function readStoredBusinesses(): CustomerBusiness[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_BUSINESSES_KEY);
    return raw ? (JSON.parse(raw) as CustomerBusiness[]) : [];
  } catch {
    return [];
  }
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [activeBusinessCode, setActiveBusinessCodeState] = useState<string | null>(() => sessionStorage.getItem(ACTIVE_KEY) ?? null);
  const [customerBusinesses, setCustomerBusinesses] = useState<CustomerBusiness[]>(() => readStoredBusinesses());

  const setActiveBusinessCode = (code: string | null) => {
    setActiveBusinessCodeState(code);
    if (code) sessionStorage.setItem(ACTIVE_KEY, code);
    else sessionStorage.removeItem(ACTIVE_KEY);
  };

  const addCustomerBusiness = (biz: CustomerBusiness) => {
    setCustomerBusinesses((prev) => {
      const next = prev.some((b) => b.code === biz.code) ? prev : [biz, ...prev];
      localStorage.setItem(CUSTOMER_BUSINESSES_KEY, JSON.stringify(next));
      return next;
    });
    setActiveBusinessCode(biz.code);
  };

  const value = useMemo(() => ({
    activeBusinessCode,
    customerBusinesses,
    setActiveBusinessCode,
    addCustomerBusiness,
    isDefaultBusiness: !activeBusinessCode || activeBusinessCode === "DEFAULT",
  }), [activeBusinessCode, customerBusinesses]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
