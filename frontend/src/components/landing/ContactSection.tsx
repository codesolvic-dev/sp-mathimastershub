import React, { useEffect, useMemo, useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import ContactCard from "@/components/landing/ContactCard";
import ContactForm from "@/components/landing/ContactForm";
import { spacing, SITE_CONTENT_INNER_CLASS } from "@/utils/spacing";
import { getCompany } from "@/api/company.api";
import { createQuery, type CreateQueryPayload } from "@/api/query.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { useToast } from "@/components/ui/toast";
import {
  splitMapAddressLabel,
  toGoogleMapDirectionsUrl,
  toGoogleMapEmbedUrl,
  toGoogleMapOpenUrl,
} from "@/utils/googleMapEmbed";

const FALLBACK_MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.184052376643!2d-73.987844923269!3d40.748440971389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b30eac6f%3A0x9d92f77d2b1c5c!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1234567890";

export interface ContactSectionProps {
  isEcom?: boolean;
  querySource?: CreateQueryPayload["source"];
}

export default function ContactSection({
  isEcom = false,
  querySource = "contact",
}: ContactSectionProps) {
  const { success, error } = useToast();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapUrl, setGoogleMapUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  useEffect(() => {
    const applyCompany = (c: any) => {
      if (!c || typeof c !== "object") return;
      if (c.phone != null) setPhone(String(c.phone));
      if (c.email != null) setEmail(String(c.email));
      if (c.address != null) setAddress(String(c.address));
      if (c.googleMapUrl != null) setGoogleMapUrl(String(c.googleMapUrl));
    };
    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) applyCompany(cached);
    getCompany()
      .then(applyCompany)
      .catch(() => {});
  }, []);

  const displayPhone = phone.trim() || "+1 5589 55488 55";
  const displayEmail = email.trim() || "info@example.com";
  const displayAddress = address.trim() || "A108 Adam Street, New York, NY 53502";

  const mapEmbedSrc = useMemo(() => {
    // Prefer company Address for the pin; googleMapUrl only as embed override
    const fromCompany = toGoogleMapEmbedUrl(googleMapUrl, address.trim());
    return fromCompany || FALLBACK_MAP_EMBED_URL;
  }, [googleMapUrl, address]);

  const mapPlaceAddress = address.trim() || displayAddress;

  const mapOpenHref = useMemo(
    () => toGoogleMapOpenUrl(googleMapUrl, mapPlaceAddress),
    [googleMapUrl, mapPlaceAddress]
  );

  const mapDirectionsHref = useMemo(
    () => toGoogleMapDirectionsUrl(mapPlaceAddress),
    [mapPlaceAddress]
  );

  const mapAddressLabel = useMemo(
    () => splitMapAddressLabel(mapPlaceAddress),
    [mapPlaceAddress]
  );

  const containerClass = `${SITE_CONTENT_INNER_CLASS} ${spacing.inner.gap}`;

  return (
    <section className={`py-10 sm:py-14 bg-white ${isEcom ? "w-full" : ""}`}>
      <div className={containerClass}>
        <SectionHeader
          showBatch={false}
          showHeading
          heading="Contact"
          cutDividerVariant="withSides"
          showMiniInfo
          miniInfo="Have a question or need help? Get in touch — we're here for you."
          showCutDivider={false}
          showDividerLine={true}
          align="center"
          className="mt-6 sm:mt-10"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mt-8 lg:mt-10">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="space-y-4">
              <ContactCard
                icon={Phone}
                title="Call"
                detail={displayPhone}
                href={`tel:${displayPhone.replace(/\s/g, "")}`}
              />
              <ContactCard
                icon={Mail}
                title="Email"
                detail={displayEmail}
                href={`mailto:${displayEmail}`}
              />
              <ContactCard
                icon={MapPin}
                title="Address"
                detail={displayAddress}
                href={mapOpenHref}
              />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 min-h-[280px]">
              <iframe
                title="Location map"
                src={mapEmbedSrc}
                width="100%"
                height="100%"
                style={{ minHeight: "280px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="border-0 w-full"
              />
              {mapAddressLabel.title ? (
                <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 sm:left-4 sm:right-auto sm:max-w-[min(100%,420px)]">
                  <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-white px-3.5 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold leading-snug text-[#202124]">
                        {mapAddressLabel.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#5f6368]">
                        {mapAddressLabel.detail}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <a
                        href={mapOpenHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on Google Maps"
                        aria-label="View on Google Maps"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#1a73e8] transition hover:bg-[#f8f9fa]"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                        </svg>
                      </a>
                      <a
                        href={mapDirectionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Directions"
                        aria-label="Get directions"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8] transition hover:bg-[#d2e3fc]"
                      >
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                          <path d="M21.71 11.29l-9-9a.996.996 0 0 0-1.41 0l-9 9a.996.996 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <ContactForm
                key={formResetKey}
                submitting={submitting}
                onSubmit={async (data) => {
                  const emailTrim = data.email.trim();
                  const msgTrim = data.message.trim();
                  if (!emailTrim || !msgTrim) {
                    error("Please enter your email and message.");
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const subjectLine = data.subject.trim() || "Contact form";
                    const body = [data.name ? `Name: ${data.name}` : null, msgTrim]
                      .filter(Boolean)
                      .join("\n\n");
                    await createQuery({
                      email: emailTrim,
                      subject: subjectLine,
                      description: body,
                      name: data.name?.trim() || "",
                      source: querySource,
                    });
                    success("Your message was sent. We will get back to you soon.");
                    setFormResetKey((k) => k + 1);
                  } catch (e: unknown) {
                    const ax = e as { response?: { data?: { message?: string } } };
                    const msg =
                      ax.response?.data?.message ||
                      (e instanceof Error ? e.message : null) ||
                      "Could not send your message.";
                    error(String(msg));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
