import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import { fetchCompanyShared } from "@/utils/companyFetch";
import {
  DEFAULT_STORE_CURRENCY,
  formatStoreMoney,
  getCurrencyConfig,
  getStoreCurrencyFromCache,
  getStorePriceShowDecimalsFromCache,
  type StoreCurrencyCode,
  type StoreCurrencyConfig,
} from "@/utils/currency";

type StoreCurrencyContextType = {
  currency: StoreCurrencyCode;
  priceShowDecimals: boolean;
  formatMoney: (amount: number) => string;
  currencyConfig: StoreCurrencyConfig;
  refreshCurrency: () => Promise<void>;
  setStoreCurrency: (code: StoreCurrencyCode) => void;
  setPriceShowDecimals: (show: boolean) => void;
};

const StoreCurrencyContext = createContext<StoreCurrencyContextType | undefined>(undefined);

export function StoreCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<StoreCurrencyCode>(() => getStoreCurrencyFromCache());
  const [priceShowDecimals, setPriceShowDecimalsState] = useState<boolean>(() =>
    getStorePriceShowDecimalsFromCache()
  );

  const refreshCurrency = useCallback(async () => {
    try {
      const company = await fetchCompanyShared();
      const code = (company?.currency || DEFAULT_STORE_CURRENCY) as StoreCurrencyCode;
      const showDecimals = company?.priceShowDecimals !== false;
      setCurrency(code);
      setPriceShowDecimalsState(showDecimals);
      if (company) {
        setCompanyCache({ ...company, currency: code, priceShowDecimals: showDecimals });
      }
    } catch {
      const cached = getCachedData<{ currency?: StoreCurrencyCode; priceShowDecimals?: boolean }>(CACHE_KEYS.COMPANY);
      if (cached?.currency) {
        setCurrency(cached.currency);
      } else {
        setCurrency(DEFAULT_STORE_CURRENCY);
      }
      setPriceShowDecimalsState(cached?.priceShowDecimals !== false);
    }
  }, []);

  useEffect(() => {
    refreshCurrency();
  }, [refreshCurrency]);

  const setStoreCurrency = useCallback((code: StoreCurrencyCode) => {
    setCurrency(code);
    setCompanyCache({ currency: code });
  }, []);

  const setPriceShowDecimals = useCallback((show: boolean) => {
    setPriceShowDecimalsState(show);
    setCompanyCache({ priceShowDecimals: show });
  }, []);

  const formatMoney = useCallback(
    (amount: number) => formatStoreMoney(amount, currency, { showDecimals: priceShowDecimals }),
    [currency, priceShowDecimals]
  );

  return (
    <StoreCurrencyContext.Provider
      value={{
        currency,
        priceShowDecimals,
        formatMoney,
        currencyConfig: getCurrencyConfig(currency),
        refreshCurrency,
        setStoreCurrency,
        setPriceShowDecimals,
      }}
    >
      {children}
    </StoreCurrencyContext.Provider>
  );
}

export function useStoreCurrency(): StoreCurrencyContextType {
  const context = useContext(StoreCurrencyContext);
  if (!context) {
    throw new Error("useStoreCurrency must be used within StoreCurrencyProvider");
  }
  return context;
}
