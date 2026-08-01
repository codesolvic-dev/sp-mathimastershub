import React, { useEffect, useMemo, useState } from "react";
import { Search, Lightbulb, Settings, Rocket } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AboutHero from "@/components/about/AboutHero";
import HowWeWork from "@/components/about/HowWeWork";
import CustomSectionFrame from "@/components/developer/CustomSectionFrame";
import { spacing } from "@/utils/spacing";
import { getBanners } from "@/api/banner.api";
import { useEcomAboutSections } from "@/hooks/useEcomAboutSections";
import { createEcomSectionRenderers } from "@/landings/tertiary/createEcomSectionRenderers";
import {
  parseMultilineStringArray,
  parseStatLinesMultiline,
  parseStepLinesMultiline,
  isContentFlagEnabled,
  SECTION_CONTENT_DEFAULTS,
} from "@/utils/landingSectionContent";
import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";

const STEP_ICONS = [Search, Lightbulb, Settings, Rocket];

function contentVal(
  contentMap: Record<string, Record<string, string>>,
  sectionId: string,
  key: string,
  fallback = ""
): string {
  return contentMap[sectionId]?.[key] ?? SECTION_CONTENT_DEFAULTS[sectionId]?.[key] ?? fallback;
}

function aboutImageFromBannerCache(): string {
  const map = getCachedData<Record<string, { imageUrl?: string }>>(CACHE_KEYS.BANNERS1);
  return map?.["about-us"]?.imageUrl || "";
}

export default function AboutUs() {
  const { sectionIds, customCodeMap, sectionLabels, contentMap } = useEcomAboutSections();
  const [aboutImage, setAboutImage] = useState(aboutImageFromBannerCache);

  const ecomRenderers = useMemo(() => createEcomSectionRenderers({}, contentMap), [contentMap]);

  useEffect(() => {
    let cancelled = false;
    getBanners()
      .then((banners) => {
        if (cancelled) return;
        const aboutBanner = banners.find((b) => b.slot === "about-us");
        setAboutImage(aboutBanner?.imageUrl || "");
        const map: Record<string, { imageUrl?: string; targetUrl?: string }> = {};
        for (const b of banners) {
          map[b.slot] = { imageUrl: b.imageUrl, targetUrl: b.targetUrl };
        }
        setCachedData(CACHE_KEYS.BANNERS1, map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const heroProps = useMemo(() => {
    const paragraphs =
      parseMultilineStringArray(contentVal(contentMap, "ecom-about-hero", "paragraphs")) ?? [];
    const stats = parseStatLinesMultiline(contentVal(contentMap, "ecom-about-hero", "statsLines"));
    const showStats = isContentFlagEnabled(contentVal(contentMap, "ecom-about-hero", "showStats"), true);
    return {
      title: contentVal(contentMap, "ecom-about-hero", "title"),
      paragraphs,
      stats: stats?.map((s) => ({ value: s.value, label: s.label.toUpperCase() })),
      showStats,
      image: aboutImage || undefined,
    };
  }, [contentMap, aboutImage]);

  const processProps = useMemo(() => {
    const stepLines = parseStepLinesMultiline(
      contentVal(contentMap, "ecom-about-process", "stepsLines")
    );
    return {
      title: contentVal(contentMap, "ecom-about-process", "title"),
      subtitle: contentVal(contentMap, "ecom-about-process", "subtitle"),
      steps:
        stepLines?.map((step, index) => ({
          icon: STEP_ICONS[index % STEP_ICONS.length],
          title: step.title,
          description: step.description,
        })) ?? undefined,
    };
  }, [contentMap]);

  const renderSection = (sectionId: string) => {
    const htmlOverride = customCodeMap[sectionId]?.trim();
    if (htmlOverride) {
      return (
        <div key={sectionId} className={spacing.section.gap}>
          <CustomSectionFrame
            html={htmlOverride}
            title={sectionLabels[sectionId] || sectionId}
          />
        </div>
      );
    }

    if (sectionId === "ecom-about-hero") {
      return <AboutHero key={sectionId} {...heroProps} />;
    }
    if (sectionId === "ecom-about-process") {
      return <HowWeWork key={sectionId} {...processProps} />;
    }

    const ecomRender = ecomRenderers[sectionId as keyof typeof ecomRenderers];
    if (ecomRender) {
      return <React.Fragment key={sectionId}>{ecomRender()}</React.Fragment>;
    }

    return null;
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <main
        className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1 w-full max-w-full overflow-x-hidden min-w-0`}
      >
        {sectionIds.map((sectionId) => renderSection(sectionId))}
      </main>
      <section
        className={`w-full ${spacing.footer.gapTop}`}
        style={{ marginBottom: 0, paddingBottom: 0 }}
      >
        <Footer />
      </section>
    </div>
  );
}
