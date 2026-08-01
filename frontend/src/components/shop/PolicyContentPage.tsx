import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getContentByType, type ContentType } from "@/api/content.api";
import { TableOfContents } from "@/components/ui/TableOfContents";
import PageLoader from "@/components/ui/PageLoader";
import { spacing } from "@/utils/spacing";

type PageContent = {
  title: string;
  subTitle: string;
  description: string;
  lastUpdated?: string;
  enabled?: boolean;
};

type PolicyContentPageProps = {
  contentType: ContentType;
  defaultTitle: string;
};

export default function PolicyContentPage({ contentType, defaultTitle }: PolicyContentPageProps) {
  const [content, setContent] = useState<PageContent>({
    title: defaultTitle,
    subTitle: "Legal page related Sub Title",
    description: "",
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const data = await getContentByType(contentType);
        if (cancelled) return;
        if (data.enabled === false) {
          setUnavailable(true);
          return;
        }
        setContent(data);
      } catch (err) {
        console.error(`Failed to load ${defaultTitle}`, err);
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [contentType, defaultTitle]);

  useEffect(() => {
    if (contentRef.current && content.description) {
      const elements = contentRef.current.querySelectorAll('[style*="text-align"]');
      elements.forEach((el) => {
        const style = el.getAttribute("style");
        if (style) {
          const match = style.match(/text-align:\s*(center|right|justify|left)/i);
          if (match) {
            (el as HTMLElement).style.textAlign = match[1] as "center" | "right" | "justify" | "left";
          }
        }
      });
    }
  }, [content.description]);

  if (loading) return <PageLoader />;

  if (unavailable) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        <Navbar />
        <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1`}>
          <div className="max-w-[640px] mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-bold theme-heading mb-3">Page not available</h1>
            <p className="text-gray-600 mb-6">
              This policy page is currently disabled.
            </p>
            <Link to="/" className="theme-button text-white inline-flex px-4 py-2 rounded-md">
              Back to home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "15 Nov 2023";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="bg-white min-h-screen flex flex-col" data-toc-sticky-page>
      <style>{`
        .content-area p[style*="text-align"],
        .content-area div[style*="text-align"],
        .content-area h1[style*="text-align"],
        .content-area h2[style*="text-align"],
        .content-area h3[style*="text-align"],
        .content-area h4[style*="text-align"],
        .content-area h5[style*="text-align"],
        .content-area h6[style*="text-align"],
        .content-area span[style*="text-align"],
        .content-area [style*="text-align"] {
          text-align: inherit !important;
        }
        .content-area [style*="text-align: center"],
        .content-area [style*="text-align:center"],
        .content-area [style*="text-align: center;"],
        .content-area [style*="text-align:center;"] {
          text-align: center !important;
        }
        .content-area [style*="text-align: right"],
        .content-area [style*="text-align:right"],
        .content-area [style*="text-align: right;"],
        .content-area [style*="text-align:right;"] {
          text-align: right !important;
        }
        .content-area [style*="text-align: justify"],
        .content-area [style*="text-align:justify"],
        .content-area [style*="text-align: justify;"],
        .content-area [style*="text-align:justify;"] {
          text-align: justify !important;
        }
        .content-area [style*="text-align: left"],
        .content-area [style*="text-align:left"],
        .content-area [style*="text-align: left;"],
        .content-area [style*="text-align:left;"] {
          text-align: left !important;
        }
      `}</style>
      <Navbar />
      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1`}>
        <section className={`w-full ${spacing.section.gap}`}>
          <div className="max-w-[1232px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="px-4 sm:px-8">
              <h1 className="text-4xl md:text-5xl font-bold theme-heading mb-4 text-center">
                {content.title || defaultTitle}
              </h1>
              <p className={`text-lg text-gray-600 text-center ${spacing.inner.gapBottom}`}>
                {content.subTitle || "Legal page related Sub Title"}
              </p>
              <div className="w-full border-t border-gray-300" style={{ marginTop: 0, marginBottom: 0 }} />
            </div>
          </div>
        </section>

        <section className={`w-full ${spacing.section.gap}`}>
          <div className="max-w-[1232px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="px-4 sm:px-8">
              <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
                <div className="hidden lg:block lg:w-64 lg:shrink-0 lg:self-start">
                  <TableOfContents htmlContent={content.description} contentRef={contentRef} />
                </div>
                <div className="flex-1">
                  <div
                    ref={contentRef}
                    className="prose prose-lg max-w-none text-gray-700 mb-0 relative content-area"
                    dangerouslySetInnerHTML={{
                      __html: content.description || "<p>No content available yet.</p>",
                    }}
                  />
                  <div className="text-right text-sm text-gray-500 mt-4 mb-0">
                    Updated: {formatDate(content.lastUpdated)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className={`w-full ${spacing.footer.gapTop}`} style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Footer />
      </section>
    </div>
  );
}
