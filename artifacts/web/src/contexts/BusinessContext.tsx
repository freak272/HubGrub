import { createContext, useContext, useState, type ReactNode } from "react";

interface BusinessContextValue {
  businessCode: string | null;
  setBusinessCode: (code: string | null) => void;
  isDefaultBusiness: boolean;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessCode, setBusinessCode] = useState<string | null>(() => {
    return sessionStorage.getItem("biz_code") ?? null;
  });

  const handleSetCode = (code: string | null) => {
    setBusinessCode(code);
    if (code) sessionStorage.setItem("biz_code", code);
    else sessionStorage.removeItem("biz_code");
  };

  return (
    <BusinessContext.Provider value={{
      businessCode,
      setBusinessCode: handleSetCode,
      isDefaultBusiness: !businessCode || businessCode === "DEFAULT",
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}
