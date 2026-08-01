import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { getCompany } from "@/api/company.api";
import { useAuth } from "@/hooks/useAuth";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import { buildWhatsAppUrl, resolveCompanyAssetUrl } from "@/utils/companyBrand";
import {
  formatConfirmationNumber,
  formatOrderMoney,
  getOrderConfirmation,
  type OrderConfirmationSnapshot,
} from "@/types/OrderConfirmation";

function getItemTotal(item: OrderConfirmationSnapshot["items"][number]): number {
  const itemPrice = Number(item.price) || 0;
  const itemDiscount = Number(item.discount) || 0;
  const itemSubtotal = itemPrice * item.quantity;
  const itemDiscountAmount = itemDiscount > 0 ? (itemDiscount / 100) * itemSubtotal : 0;
  return itemSubtotal - itemDiscountAmount;
}

function getPaymentLabel(payment: string, bill: number, currency: string): string {
  const amount = formatOrderMoney(bill, currency);
  if (payment === "Cash on Delivery" || payment === "cod") {
    return `Cash on delivery — ${amount} ${currency}`;
  }
  if (payment === "card") {
    return `Credit card — ${amount} ${currency}`;
  }
  return `${payment} — ${amount} ${currency}`;
}

function getOrderSubmittedMessage(snapshot: OrderConfirmationSnapshot): string {
  if (snapshot.payment === "Bank Deposit") {
    return (
      snapshot.thankYouNote?.trim() ||
      "Your order has been submitted. Please complete your bank transfer to confirm your order."
    );
  }
  if (snapshot.payment === "Cash on Delivery" || snapshot.payment === "cod") {
    return "Your order has been submitted. You will pay cash when your order is delivered.";
  }
  if (snapshot.payment === "card") {
    return "Your order has been submitted and your payment has been received.";
  }
  return "Your order has been submitted.";
}

function getConfirmationMessage(snapshot: OrderConfirmationSnapshot): string {
  const isCod = snapshot.payment === "Cash on Delivery" || snapshot.payment === "cod";
  if (isCod) {
    return "Your order has been placed successfully. You will pay cash when your order is delivered to your address.";
  }
  if (snapshot.thankYouNote?.trim()) {
    return snapshot.thankYouNote.trim();
  }
  return "Your order has been placed successfully. Your payment has been processed.";
}

export default function OrderThankYouPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<OrderConfirmationSnapshot | null>(null);
  const [companyName, setCompanyName] = useState("Store");
  const [companyLogo, setCompanyLogo] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [companyWhatsApp, setCompanyWhatsApp] = useState("");
  const [emailOffers, setEmailOffers] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate("/shop", { replace: true });
      return;
    }

    const stored = getOrderConfirmation(orderId);
    if (!stored) {
      navigate("/shop", { replace: true });
      return;
    }
    setSnapshot(stored);
  }, [orderId, navigate]);

  useEffect(() => {
    const applyCompany = (company: any) => {
      if (company?.company) setCompanyName(company.company);
      setCompanyLogo(resolveCompanyAssetUrl(company?.logo) || "");
      setSupportEmail(company?.supportEmail || company?.email || "");
      // Company Info → Phone (same number used site-wide for WhatsApp)
      setCompanyWhatsApp(String(company?.phone || "").trim());
      setLogoError(false);
    };

    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) applyCompany(cached);

    getCompany()
      .then((company) => {
        setCompanyCache(company);
        applyCompany(company);
      })
      .catch(() => { });
  }, []);

  if (!snapshot) {
    return null;
  }

  const confirmationNumber = snapshot.confirmationNumber || formatConfirmationNumber(snapshot.orderId);
  const contactEmail = snapshot.email || user?.email || "";
  const helpHref = supportEmail ? `mailto:${supportEmail}` : "/";
  const whatsappHref = companyWhatsApp
    ? buildWhatsAppUrl(companyWhatsApp, `Hello, I need help with order #${confirmationNumber}`)
    : "";
  const orderSubmittedMessage = getOrderSubmittedMessage(snapshot);

  const orderSummaryItems = (
    <div className="space-y-4">
      {snapshot.items.map((item, index) => {
        const variant = [item.selectedColor, item.selectedSize, item.selectedCustomValue]
          .filter(Boolean)
          .join(" · ");

        return (
          <div key={`${item.name}-${index}`} className="flex gap-3 items-start">
            <div className="relative shrink-0">
              <img
                src={item.image || "/product.png"}
                alt={item.name}
                className="w-16 h-16 rounded-md border border-gray-200 object-cover bg-white"
              />
              <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
              {variant && <p className="text-xs text-gray-500 mt-0.5">{variant}</p>}
            </div>
            <span className="text-sm font-medium text-gray-900 shrink-0">
              {formatOrderMoney(getItemTotal(item), snapshot.currency)}
            </span>
          </div>
        );
      })}
    </div>
  );

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
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto w-full border-x border-gray-200 lg:min-h-[calc(100vh-73px)]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="px-4 sm:px-8 lg:px-10 py-8 lg:py-10 lg:border-r border-gray-200">
              <div className="max-w-lg mx-auto space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--theme-primary)" }}
                    >
                      <Check className="w-6 h-6 text-white stroke-[3]" />
                    </div>
                    <p className="text-sm text-gray-500">Confirmation #{confirmationNumber}</p>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 theme-heading">
                    Thank you, {snapshot.firstName}!
                  </h1>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-2">Your order is confirmed</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {getConfirmationMessage(snapshot)}
                    </p>
                  </div>
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                    <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailOffers}
                        onChange={(e) => setEmailOffers(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Email me with news and offers
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-5">Order details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Contact information</p>
                      <p className="text-gray-900">{contactEmail || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Payment method</p>
                      <p className="text-gray-900">
                        {getPaymentLabel(snapshot.payment, snapshot.bill, snapshot.currency)}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-gray-500 mb-1">Billing address</p>
                      <div className="text-gray-900 leading-relaxed">
                        <p>{snapshot.address.firstName} {snapshot.address.lastName}</p>
                        <p>{snapshot.address.line1}{snapshot.address.area ? `, ${snapshot.address.area}` : ""}</p>
                        <p>
                          {snapshot.address.city} {snapshot.address.postalCode}
                        </p>
                        <p>{snapshot.address.province}</p>
                        <p>{snapshot.address.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <a
                      href={helpHref}
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--theme-primary)" }}
                    >
                      Need help?
                    </a>
                    <a
                      href="/contact-us"
                      className="text-sm font-medium hover:underline"
                      style={{ color: "var(--theme-primary)" }}
                    >
                      Contact us
                    </a>
                    {whatsappHref && (
                      <>
                        <span className="text-gray-400 text-sm">|</span>
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                          style={{ color: "#25D366" }}
                        >
                          WhatsApp 
                          {/* {companyWhatsApp} */}
                        </a>
                      </>
                    )}
                  </div>
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-white text-sm font-medium theme-button"
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 lg:border-l border-gray-200 border-t lg:border-t-0">
              <div className="px-4 sm:px-8 py-8 lg:sticky lg:top-0">
                <div className="max-w-sm mx-auto">
                  {orderSummaryItems}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base text-gray-600">Total</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-500 mr-1">{snapshot.currency}</span>
                        <span className="text-xl font-semibold text-gray-900">
                          {formatOrderMoney(snapshot.bill, snapshot.currency)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                      {orderSubmittedMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
