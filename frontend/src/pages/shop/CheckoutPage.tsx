import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/components/products/CartContext";
import CheckoutContent from "@/components/checkout/CheckoutContent";
import StripeElementsProvider from "@/components/checkout/StripeElementsProvider";
import { getCompany } from "@/api/company.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { resolveCompanyAssetUrl } from "@/utils/companyBrand";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [companyName, setCompanyName] = useState("Store");
  const [companyLogo, setCompanyLogo] = useState("");
  const [logoError, setLogoError] = useState(false);
  const isCompletingOrder = useRef(false);

  useEffect(() => {
    const applyCompany = (company: any) => {
      if (company?.company) setCompanyName(company.company);
      setCompanyLogo(resolveCompanyAssetUrl(company?.logo) || "");
      setLogoError(false);
    };

    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) applyCompany(cached);

    getCompany()
      .then((company) => applyCompany(company))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isCompletingOrder.current) return;
    if (cartItems.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartItems.length, navigate]);

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center shrink-0">
            {companyLogo && !logoError ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-10 sm:h-12 w-auto max-w-[180px] object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-xl font-semibold text-gray-900 theme-heading truncate">
                {companyName}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="text-sm text-[var(--theme-primary)] hover:underline shrink-0"
          >
            ← Return to cart
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">
        <StripeElementsProvider>
          <CheckoutContent
            layout="page"
            isActive
            onComplete={(orderId) => {
              isCompletingOrder.current = true;
              navigate(`/checkout/thank-you/${orderId}`, { replace: true });
            }}
          />
        </StripeElementsProvider>
      </main>
    </div>
  );
}
