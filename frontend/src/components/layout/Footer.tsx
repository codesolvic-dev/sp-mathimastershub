import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCompany } from "@/api/company.api";
import { getFooter } from "@/api/footer.api";
import { getCategories } from "@/api/category.api";
import { getProducts } from "@/api/product.api";
import { getCachedData, setCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import LandingSocialIconButtons from "@/components/landing/LandingSocialIconButtons";
import { spacing, FOOTER_INNER_CLASS } from "@/utils/spacing";
import { buildWhatsAppUrl } from "@/utils/companyBrand";
import {
  FOOTER_COLUMN_GRID,
  normalizeFooterSettings,
  getOrderedContactEntries,
  DEFAULT_CONTACT_INFO,
  DEFAULT_CONTACT_FIELD_ORDER,
} from "@/utils/footerSettings";

type FooterVariant = "default" | "landing2";

interface FooterLink {
  label: string;
  url: string;
  order: number;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
  order: number;
  enabled?: boolean;
}

function mapFooterState(footer: any, copyrightText: string) {
  const normalized = normalizeFooterSettings(footer);
  const allSections = footer?.sections || [];
  return {
    allSections,
    sections: allSections
      .filter((s: FooterSection) => s.enabled !== false)
      .sort((a: FooterSection, b: FooterSection) => a.order - b.order),
    copyright: copyrightText,
    showCategories: normalized.showCategories,
    showProducts: normalized.showProducts,
    showSocialIcons: normalized.showSocialIcons,
    showSocialLinks: normalized.showSocialLinks,
    showSocialGallery: normalized.showSocialGallery,
    showContact: normalized.showContact,
    contactInfo: normalized.contactInfo,
    contactFieldOrder: normalized.contactFieldOrder,
    columnOrder: normalized.columnOrder,
    columnSettings: normalized.columnSettings,
    footerColumnsPerRow: normalized.gridSettings.footerColumnsPerRow,
  };
}

export default function Footer({ variant = "default" }: { variant?: FooterVariant }) {
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState({
    company: "VERES",
    copyright: "",
    description: "",
    email: "",
    supportEmail: "",
    phone: "",
    address: "",
    website: "",
    socialPosts: [] as Array<{ image: string; url: string; order: number }>,
    socialLinks: {} as Record<string, string>,
  });
  const [footerData, setFooterData] = useState({
    sections: [] as FooterSection[],
    copyright: "",
    showCategories: false,
    showProducts: false,
    showSocialIcons: false,
    showSocialLinks: false,
    showSocialGallery: true,
    showContact: false,
    contactInfo: { ...DEFAULT_CONTACT_INFO },
    contactFieldOrder: [...DEFAULT_CONTACT_FIELD_ORDER],
    allSections: [] as FooterSection[],
    columnOrder: [] as string[],
    columnSettings: {
      categoriesCount: 3,
      productsCount: 3,
      socialGalleryCount: 8,
    },
    footerColumnsPerRow: 4,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from cache first for faster initial render
        const cachedCompany = getCachedData<any>(CACHE_KEYS.COMPANY);
        const cachedFooter = getCachedData<any>(CACHE_KEYS.FOOTER);
        const cachedCategories = getCachedData<any[]>(CACHE_KEYS.CATEGORIES);
        const cachedProducts = getCachedData<any[]>(CACHE_KEYS.PRODUCTS);

        // Use cached data immediately if available
        if (cachedCompany) {
          setCompanyData({
            company: cachedCompany.company || "VERES",
            copyright: cachedCompany.copyright || "",
            description: cachedCompany.description || "",
            email: cachedCompany.email || "",
            supportEmail: cachedCompany.supportEmail || "",
            phone: cachedCompany.phone || "",
            address: cachedCompany.address || "",
            website: cachedCompany.website || "",
            socialPosts: (cachedCompany.socialPosts || [])
              .filter((post: any) => post && post.image && post.image.trim() !== "")
              .slice(0, 12),
            socialLinks: cachedCompany.socialLinks || {},
          });
        }
        if (cachedFooter) {
          setFooterData(
            mapFooterState(
              cachedFooter,
              cachedFooter.copyright ||
                `© ${new Date().getFullYear()} ${cachedCompany?.company || "VERES"}. All rights reserved.`
            )
          );
        }
        if (cachedCategories) {
          setCategories(cachedCategories);
        }
        if (cachedProducts) {
          setProducts(cachedProducts);
        }

        // Fetch fresh data in background and update cache
        const [companyData, footerData, categoriesData, productsData] = await Promise.all([
          getCompany(),
          getFooter().catch(() => ({ sections: [], copyright: "" })),
          getCategories({ activeOnly: true }).catch(() => []),
          getProducts({ activeOnly: true }).catch(() => []),
        ]);

        const company = companyData;
        const footer = footerData;

        // Cache the data (24 hours)
        setCompanyCache(company);
        setCachedData(CACHE_KEYS.FOOTER, footer);
        setCachedData(CACHE_KEYS.CATEGORIES, categoriesData || []);
        setCachedData(CACHE_KEYS.PRODUCTS, productsData || []);

        // Process social posts - ensure they have valid images
        // Helper to get full image URL
        const getImageUrl = (imageUrl: string): string => {
          if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === "") {
            return "";
          }

          const trimmed = imageUrl.trim();

          // If it's a base64 data URL, return as is (shouldn't happen after upload, but handle it)
          if (trimmed.startsWith('data:')) {
            return "";
          }

          // Exclude Facebook CDN URLs (they give 403 errors due to hotlink protection)
          const imageLower = trimmed.toLowerCase();
          if (imageLower.includes('fbcdn.net') ||
            imageLower.includes('scontent.') ||
            (imageLower.includes('facebook.com') && imageLower.includes('scontent'))) {
            return ""; // Return empty string to filter out
          }

          // If it's already a full URL (Cloudinary or http/https), return as is
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
          }

          // If it's a relative path, construct full URL
          const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((url: string) => url.trim()).filter(Boolean);
          const isLocalhost = typeof window !== 'undefined' && (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          );
          const API_BASE_URL = isLocalhost ? urls[0] : (urls[1] || urls[0] || import.meta.env.VITE_API_URL || "");
          const apiBaseWithoutApi = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';

          if (trimmed.startsWith('/')) {
            return `${apiBaseWithoutApi}${trimmed}`;
          }

          return `${apiBaseWithoutApi}/${trimmed}`;
        };

        const validSocialPosts = (company.socialPosts || [])
          .filter((post: any) => {
            if (!post || !post.image || typeof post.image !== 'string' || post.image.trim() === "") {
              return false;
            }

            // Exclude base64 (should be uploaded by now)
            if (post.image.startsWith('data:')) {
              return false;
            }

            // Exclude Facebook CDN URLs (they give 403 errors due to hotlink protection)
            const imageLower = post.image.toLowerCase();
            if (imageLower.includes('fbcdn.net') ||
              imageLower.includes('scontent.') ||
              (imageLower.includes('facebook.com') && imageLower.includes('scontent'))) {
              console.warn("Filtering out Facebook CDN URL (403 error):", post.image);
              return false;
            }

            return true;
          })
          .map((post: any) => {
            const imageUrl = getImageUrl(post.image);
            return {
              image: imageUrl,
              url: post.url || "#",
              order: post.order || 0
            };
          })
          .filter((post: any) => post.image !== "") // Remove posts with invalid URLs
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .slice(0, 12);

        console.log("Social Posts loaded:", {
          total: (company.socialPosts || []).length,
          valid: validSocialPosts.length,
          posts: validSocialPosts,
          rawPosts: company.socialPosts
        }); // Debug log

        // Double check - filter out any Facebook URLs that might have slipped through
        const finalValidPosts = validSocialPosts.filter((post: any) => {
          if (!post || !post.image) return false;
          const imageLower = post.image.toLowerCase();
          return !imageLower.includes('fbcdn.net') &&
            !imageLower.includes('scontent.') &&
            !(imageLower.includes('facebook.com') && imageLower.includes('scontent'));
        });

        console.log("Final filtered social posts:", {
          before: validSocialPosts.length,
          after: finalValidPosts.length,
          filtered: validSocialPosts.length - finalValidPosts.length
        });

        setCompanyData({
          company: company.company || "VERES",
          copyright: company.copyright || "",
          description: company.description || "",
          email: company.email || "",
          supportEmail: company.supportEmail || "",
          phone: company.phone || "",
          address: company.address || "",
          website: company.website || "",
          socialPosts: finalValidPosts,
          socialLinks: company.socialLinks || {},
        });

        // Use copyright from company first, then footer, then default
        const copyrightText = company.copyright || footer.copyright || `© ${new Date().getFullYear()} ${company.company || "VERES"}. All rights reserved.`;

        // Debug: Log footer data to see what we're getting
        console.log("Footer data from API:", footer);
        console.log("showCategories:", footer.showCategories, typeof footer.showCategories);
        console.log("showProducts:", footer.showProducts, typeof footer.showProducts);
        console.log("showSocialIcons:", footer.showSocialIcons, typeof footer.showSocialIcons);
        console.log("showSocialLinks:", footer.showSocialLinks, typeof footer.showSocialLinks);

        setFooterData(mapFooterState(footer, copyrightText));
        setCategories(categoriesData || []);
        setProducts(productsData || []);
      } catch (err) {
        console.error("Failed to load footer data", err);
        // Try to use cached data as fallback
        const cachedCompany = getCachedData<any>(CACHE_KEYS.COMPANY);
        const cachedFooter = getCachedData<any>(CACHE_KEYS.FOOTER);
        if (cachedCompany) {
          setCompanyData({
            company: cachedCompany.company || "VERES",
            copyright: cachedCompany.copyright || "",
            description: cachedCompany.description || "",
            email: cachedCompany.email || "",
            supportEmail: cachedCompany.supportEmail || "",
            phone: cachedCompany.phone || "",
            address: cachedCompany.address || "",
            website: cachedCompany.website || "",
            socialPosts: (cachedCompany.socialPosts || [])
              .filter((post: any) => post && post.image && post.image.trim() !== "")
              .slice(0, 12),
            socialLinks: cachedCompany.socialLinks || {},
          });
        }
        if (cachedFooter) {
          setFooterData(
            mapFooterState(
              cachedFooter,
              cachedFooter.copyright ||
                `© ${new Date().getFullYear()} ${cachedCompany?.company || "VERES"}. All rights reserved.`
            )
          );
        }
      }
    };
    loadData();
  }, []);

  const handleLinkClick = (url: string) => {
    if (!url || url === "#") return;

    // Check if it's an external URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank");
    } else {
      // Internal route
      navigate(url);
    }
  };

  const enabledSections = footerData.sections.filter(s => s.enabled !== false);
  const companySocialLinks = companyData.socialLinks || {};
  const hasAnyFooterSocialLink = Object.values(companySocialLinks).some((v) => String(v || "").trim() !== "" && String(v).trim() !== "#");
  const galleryCount = footerData.columnSettings.socialGalleryCount;
  const visibleSocialPosts = companyData.socialPosts.slice(0, galleryCount);
  const footerColumnGrid =
    FOOTER_COLUMN_GRID[footerData.footerColumnsPerRow] || FOOTER_COLUMN_GRID[4];

  const contactEntries = getOrderedContactEntries(
    footerData.contactInfo,
    footerData.contactFieldOrder
  );

  const isColumnVisible = (columnId: string) => {
    if (columnId === "categories") return footerData.showCategories && categories.length > 0;
    if (columnId === "products") return footerData.showProducts && products.length > 0;
    if (columnId === "contact") return footerData.showContact && contactEntries.length > 0;
    if (columnId === "socialLinks") return footerData.showSocialLinks && hasAnyFooterSocialLink;
    if (columnId === "socialGallery") return footerData.showSocialGallery && visibleSocialPosts.length > 0;
    if (columnId.startsWith("section-")) {
      const idx = Number.parseInt(columnId.replace("section-", ""), 10);
      const section = footerData.allSections[idx];
      return !!section && section.enabled !== false;
    }
    return false;
  };

  const hasFooterColumns = footerData.columnOrder.some(isColumnVisible) || enabledSections.length > 0;

  const renderFooterColumn = (columnId: string) => {
    if (!isColumnVisible(columnId)) return null;

    if (columnId === "categories") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg" style={{ marginBottom: "16px" }}>Categories</h3>
          <div className="space-y-2 text-sm text-gray-100">
            {categories.slice(0, footerData.columnSettings.categoriesCount).map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="block text-gray-100 hover:underline"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (columnId === "products") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg" style={{ marginBottom: "16px" }}>Products</h3>
          <div className="space-y-2 text-sm text-gray-100">
            {products.slice(0, footerData.columnSettings.productsCount).map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="block text-gray-100 hover:underline"
              >
                {product.name}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    if (columnId === "contact") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg" style={{ marginBottom: "16px" }}>
            {footerData.contactInfo.title || "Contact"}
          </h3>
          <div className="space-y-2 text-sm text-gray-100">
            {contactEntries.map((entry) => {
              if (entry.key === "supportEmail" || entry.key === "email") {
                return (
                  <p key={entry.key}>
                    <a href={`mailto:${entry.value}`} className="hover:underline">
                      {entry.value}
                    </a>
                  </p>
                );
              }
              if (entry.key === "phone") {
                return <p key={entry.key}>{entry.value}</p>;
              }
              return (
                <p key={entry.key} className="leading-relaxed">
                  {entry.value}
                </p>
              );
            })}
          </div>
        </div>
      );
    }

    if (columnId === "socialLinks") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg" style={{ marginBottom: "16px" }}>Follow Us</h3>
          <LandingSocialIconButtons
            links={companySocialLinks}
            useDefaults={false}
            className="justify-start"
          />
        </div>
      );
    }

    if (columnId === "socialGallery") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg" style={{ marginBottom: "16px" }}>Social Gallery</h3>
          {renderSocialPosts()}
        </div>
      );
    }

    if (columnId.startsWith("section-")) {
      const idx = Number.parseInt(columnId.replace("section-", ""), 10);
      const section = footerData.allSections[idx];
      if (!section) return null;
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg" style={{ marginBottom: "16px" }}>{section.title}</h3>
          <div className="space-y-2 text-sm text-gray-100">
            {[...section.links]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((link, linkIndex) => (
              <button
                key={linkIndex}
                onClick={() => handleLinkClick(link.url)}
                className="block text-left text-gray-100 hover:underline"
                style={{ cursor: "pointer" }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSocialPosts = () => (
    <div className="grid grid-cols-4 gap-2 lg:gap-3 w-full max-w-[18rem] sm:max-w-xs">
      {visibleSocialPosts.map((post, index) => (
        <a
          key={index}
          href={post.url || "#"}
          target={post.url && post.url !== "#" ? "_blank" : undefined}
          rel={post.url && post.url !== "#" ? "noopener noreferrer" : undefined}
          className="w-full aspect-square rounded overflow-hidden hover:opacity-80 transition-opacity bg-gray-700"
        >
          <img
            src={post.image}
            alt={`Social post ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </a>
      ))}
    </div>
  );

  return (
    <footer className="text-gray-300" style={{ backgroundColor: "var(--theme-dark, #6B4A2C)" }}>
      {/* <div className={`max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 ${spacing.section.gapTop} ${spacing.section.gapBottomLarge}`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-center gap-8 sm:gap-10 lg:gap-20"> */}
      {/* Left side - Logo and Footer Sections */}
      {/* <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-6 sm:gap-8 lg:gap-20 lg:justify-center"> */}
      {/* Logo */}
      {/* <div className="flex flex-col items-center text-center space-y-4 lg:min-w-[160px]">
              <span className="text-white font-serif text-2xl lg:text-3xl font-semibold">{companyData.company}</span> */}
      {/* Social Icons - 2nd landing style: white icons on circular beige backgrounds */}
      {/* {(variant === "landing2" || footerData.showSocialIcons) && (
                <div className="flex gap-2 sm:gap-3 mt-2 justify-center"> */}
      {/* {[
                    { href: companyData.socialLinks?.twitter || companyData.socialLinks?.x || "#", Icon: XIcon, label: "X" },
                    { href: companyData.socialLinks?.facebook || "#", Icon: Facebook, label: "Facebook" },
                    { href: companyData.socialLinks?.instagram || "#", Icon: Instagram, label: "Instagram" },
                    { href: companyData.socialLinks?.skype || "#", Icon: FaSkype, label: "Skype" },
                    { href: companyData.socialLinks?.linkedin || "#", Icon: Linkedin, label: "LinkedIn" },
                  ].filter(({ href }) => href && href !== "#").map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      {...(href && href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      aria-label={label}
                      className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: "var(--theme-primary, #8B5E3C)" }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </a>
                  ))}
                </div>
              )}
            </div> */}

      {/* Categories Column - if enabled */}
      {/* {footerData.showCategories && categories.length > 0 && (
              <div className="flex flex-col text-base lg:min-w-[140px]">
                <h3 className="text-white font-semibold text-lg">Categories</h3>
                <div className="flex flex-col space-y-3 lg:space-y-4 mt-3 lg:mt-4">
                  {categories.slice(0, 3).map((category) => (
                    <Link
                      key={category._id}
                      to={`/shop?category=${encodeURIComponent(category.name)}`}
                      className="text-gray-300 hover:underline"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )} */}

      {/* Products Column - if enabled */}
      {/* {footerData.showProducts && products.length > 0 && (
              <div className="flex flex-col text-base lg:min-w-[140px]">
                <h3 className="text-white font-semibold text-lg">Products</h3>
                <div className="flex flex-col space-y-3 lg:space-y-4 mt-3 lg:mt-4">
                  {products.slice(0, 3).map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="text-gray-300 hover:underline"
                    >
                      {product.name}
                    </Link>
                  ))}
                </div>
              </div>
            )} */}

      {/* Footer Sections from SP Panel */}
      {/* {enabledSections.map((section, index) => (
              <div key={index} className="flex flex-col text-base lg:min-w-[140px]">
                <h3 className="text-white font-semibold text-lg">{section.title}</h3>
                <div className="flex flex-col space-y-3 lg:space-y-4 mt-3 lg:mt-4">
                  {section.links.map((link, linkIndex) => (
                    <button
                      key={linkIndex}
                      onClick={() => handleLinkClick(link.url)}
                      className="text-left text-gray-300 hover:underline"
                      style={{ cursor: "pointer" }}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            ))} */}

      {/* Social Links Column - if enabled */}
      {/* {footerData.showSocialLinks && companyData.socialLinks && (
              <div className="flex flex-col text-base lg:min-w-[140px]">
                <h3 className="text-white font-semibold text-lg">Follow Us</h3>
                <div className="flex flex-col space-y-3 lg:space-y-4 mt-3 lg:mt-4">
                  {companyData.socialLinks.facebook && (
                    <a href={companyData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline">
                      Facebook
                    </a>
                  )}
                  {companyData.socialLinks.instagram && (
                    <a href={companyData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline">
                      Instagram
                    </a>
                  )} */}
      {/* {companyData.socialLinks.linkedin && (
                    <a href={companyData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline">
                      LinkedIn
                    </a>
                  )}
                  {companyData.socialLinks.youtube && (
                    <a href={companyData.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:underline">
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div> */}

      {/* Right side - Social Posts Gallery - only show if there are posts - Large screens only */}
      {/* {companyData.socialPosts && companyData.socialPosts.length > 0 && (
            <div className="hidden lg:block lg:ml-auto lg:shrink-0">
              <div className="grid grid-cols-4 gap-2 lg:gap-3 w-72 lg:w-96">
                {companyData.socialPosts
                  .filter((post: any) => {
                    if (!post || !post.image) return false;
                    const imageLower = post.image.toLowerCase();
                    return !imageLower.includes('fbcdn.net') && 
                           !imageLower.includes('scontent.') &&
                           !(imageLower.includes('facebook.com') && imageLower.includes('scontent'));
                  })
                  .slice(0, 8)
                  .map((post, index) => (
                    <a
                      key={index}
                      href={post.url || "#"}
                      target={post.url && post.url !== "#" ? "_blank" : undefined}
                      rel={post.url && post.url !== "#" ? "noopener noreferrer" : undefined}
                      className="w-full aspect-square rounded overflow-hidden hover:opacity-80 transition-opacity bg-gray-700"
                    >
                      <img
                        src={post.image}
                        alt={`Social post ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div> */}

      {/* Small screens - Social Posts Gallery - Show after all columns */}
      {/* {companyData.socialPosts && companyData.socialPosts.length > 0 && (
          <div className="lg:hidden w-full mt-6">
            <div className="grid grid-cols-4 gap-2">
              {companyData.socialPosts
                .filter((post: any) => {
                  if (!post || !post.image) return false;
                  const imageLower = post.image.toLowerCase();
                  return !imageLower.includes('fbcdn.net') && 
                         !imageLower.includes('scontent.') &&
                         !(imageLower.includes('facebook.com') && imageLower.includes('scontent'));
                })
                .slice(0, 8)
                .map((post, index) => (
                  <a
                    key={index}
                    href={post.url || "#"}
                    target={post.url && post.url !== "#" ? "_blank" : undefined}
                    rel={post.url && post.url !== "#" ? "noopener noreferrer" : undefined}
                    className="w-full aspect-square rounded overflow-hidden hover:opacity-80 transition-opacity bg-gray-700"
                  >
                    <img
                      src={post.image}
                      alt={`Social post ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </a>
                ))}
            </div>
          </div>
        )} */}

      {/* Bottom bar */}
      {/* <div className={`${spacing.margin.top} border-t border-gray-600 ${spacing.section.gapTop} ${spacing.section.gapBottom} flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-3`}> */}
      {/* <span className="text-center md:text-left">{footerData.copyright || `© ${new Date().getFullYear()} ${companyData.company}. All rights reserved.`}</span> */}
      {/* <div className="flex gap-3 sm:gap-4">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>PayPal</span>
          // </div> */}
      {/* </div> */}

      {/* </div> */}
      <div className={`${FOOTER_INNER_CLASS} py-12`}>
        <div className={`grid grid-cols-1 gap-8 ${footerColumnGrid}`}>
          <div className={hasFooterColumns ? "sm:col-span-2 lg:col-span-1" : "sm:col-span-2 lg:col-span-3 text-center"}>
            <h2 className="text-2xl font-semibold text-white" style={{ marginBottom: "16px" }}>{companyData.company || "VERES"}</h2>
            <p className={`text-gray-100 text-sm ${hasFooterColumns ? "max-w-xl" : "max-w-xl mx-auto"}`}>
              {companyData.description || "We are updating our premium products with real-time support and a dedicated consultant."}
            </p>
            {footerData.showSocialIcons && hasAnyFooterSocialLink && (
              <div style={{ marginTop: "16px" }}>
                <LandingSocialIconButtons
                  links={companySocialLinks}
                  useDefaults={false}
                  className={hasFooterColumns ? "justify-start" : "justify-center"}
                />
              </div>
            )}
          </div>

          {footerData.columnOrder.map((columnId) => renderFooterColumn(columnId))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 py-4">
        <div className={`${FOOTER_INNER_CLASS} flex flex-col md:flex-row justify-between items-center text-sm text-gray-100 gap-2`}>
          <span className="text-center md:text-left">
            {companyData.copyright?.trim() ||
              footerData.copyright?.trim() ||
              `© ${new Date().getFullYear()} ${companyData.company || "VERES"}. All rights reserved.`}
          </span>
          <a
            href={buildWhatsAppUrl(
              companyData.phone,
              "Hello, I visited the ZI_Core site. I would like to ask you"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-100 hover:opacity-90 cursor-pointer underline-offset-2 hover:underline"
          >
            Join {companyData.company || "Company"}
          </a>
        </div>
      </div>
    </footer>
  );
}
