import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import { getCompany } from "@/api/company.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";

const DEFAULT_MESSAGE = "Hello, I visited your site. I would like to ask you";

const HIDDEN_PREFIXES = ["/admin", "/developer"];

export default function SiteFloatingWhatsApp() {
  const { pathname } = useLocation();
  const [phone, setPhone] = useState("");

  const isHidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    if (isHidden) return;

    const applyPhone = (company: any) => {
      const value = company?.phone || company?.paymentSettings?.whatsappNumber || "";
      setPhone(String(value).trim());
    };

    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) applyPhone(cached);

    getCompany()
      .then((company) => {
        setCompanyCache(company);
        applyPhone(company);
      })
      .catch(() => {});
  }, [isHidden]);

  if (isHidden || !phone) return null;

  return (
    <FloatingWhatsApp
      phoneNumber={phone}
      message={DEFAULT_MESSAGE}
      label="Chat on WhatsApp"
    />
  );
}
