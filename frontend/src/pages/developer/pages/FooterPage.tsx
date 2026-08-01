import React, { useState, useEffect, useMemo } from "react";
import { PanelBottom, Save, Plus, Trash2, GripVertical, X, ShoppingCart, FileText, Image, Mail } from "lucide-react";
import { getCompany } from "@/api/company.api";
import { getCategories } from "@/api/category.api";
import { getProducts } from "@/api/product.api";
import { getFooter, updateFooter } from "@/api/footer.api";
import { getEnabledWebPagesByLocation } from "@/api/webpage.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import { getCachedData, setCachedData, removeCachedData, CACHE_KEYS } from "@/utils/cache";
import LandingSocialIconButtons from "@/components/landing/LandingSocialIconButtons";
import {
  DEFAULT_COLUMN_SETTINGS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_CONTACT_INFO,
  DEFAULT_CONTACT_FIELD_ORDER,
  CONTACT_FIELD_LABELS,
  normalizeFooterSettings,
  getOrderedContactEntries,
  getFooterColumnLabel,
  getSectionColumnId,
  normalizeFooterColumnOrder,
  reindexFooterColumnOrder,
  FOOTER_COLUMN_GRID,
  type ContactFieldKey,
} from "@/utils/footerSettings";

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

// Custom Grid Icon Component - shows bars representing grid count
const GridIcon = ({ count, isSelected }: { count: number; isSelected: boolean }) => {
  const color = isSelected ? "var(--theme-primary)" : "#6B7280";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {count === 3 && (
        <>
          <rect x="2" y="2" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="10" y="2" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="18" y="2" width="4" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="2" y="10" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="10" y="10" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="18" y="10" width="4" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="2" y="18" width="6" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="10" y="18" width="6" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="18" y="18" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
        </>
      )}
      {count === 4 && (
        <>
          <rect x="1" y="1" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="7" y="1" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="13" y="1" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="19" y="1" width="4" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="1" y="7.5" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="7" y="7.5" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="13" y="7.5" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="19" y="7.5" width="4" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="1" y="14" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="7" y="14" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="13" y="14" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="19" y="14" width="4" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="1" y="20.5" width="4.5" height="3.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="7" y="20.5" width="4.5" height="3.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="13" y="20.5" width="4.5" height="3.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
          <rect x="19" y="20.5" width="4" height="3.5" stroke={color} strokeWidth="1.5" fill="none" rx="1"/>
        </>
      )}
      {count === 5 && (
        <>
          <rect x="0.5" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="5" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="9.5" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="14" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="18.5" y="0.5" width="5" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="0.5" y="5.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="5" y="5.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="9.5" y="5.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="14" y="5.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="18.5" y="5.5" width="5" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="0.5" y="10.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="5" y="10.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="9.5" y="10.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="14" y="10.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="18.5" y="10.5" width="5" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="0.5" y="15.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="5" y="15.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="9.5" y="15.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="14" y="15.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="18.5" y="15.5" width="5" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="0.5" y="20.5" width="4" height="3" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="5" y="20.5" width="4" height="3" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="9.5" y="20.5" width="4" height="3" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="14" y="20.5" width="4" height="3" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
          <rect x="18.5" y="20.5" width="5" height="3" stroke={color} strokeWidth="1.5" fill="none" rx="0.5"/>
        </>
      )}
    </svg>
  );
};

export default function FooterPage() {
  const { success, error } = useToast();
  const [footer, setFooter] = useState<{
    sections: FooterSection[];
    socialLinks: Record<string, string>;
    copyright: string;
    description: string;
    showPreview: boolean;
    showCategories: boolean;
    showProducts: boolean;
    showSocialIcons: boolean;
    showSocialLinks: boolean;
    showSocialGallery: boolean;
    showContact: boolean;
    contactInfo: {
      title: string;
      supportEmail: string;
      email: string;
      phone: string;
      address: string;
    };
    contactFieldOrder: ContactFieldKey[];
    columnOrder: string[];
    columnSettings: {
      categoriesCount: number;
      productsCount: number;
      socialGalleryCount: number;
    };
    gridSettings: {
      productsPerRow: number;
      blogsPerRow: number;
      footerColumnsPerRow: number;
    };
  }>(() => {
    const c = getCachedData<any>(CACHE_KEYS.FOOTER_EDITOR);
    if (c?.footer && typeof c.footer === 'object') return c.footer;
    return {
      sections: [],
      socialLinks: {},
      copyright: "",
      description: "",
      showPreview: true,
      showCategories: false,
      showProducts: false,
      showSocialIcons: false,
      showSocialLinks: false,
      showSocialGallery: true,
      showContact: false,
      contactInfo: { ...DEFAULT_CONTACT_INFO },
      contactFieldOrder: [...DEFAULT_CONTACT_FIELD_ORDER],
      columnOrder: [],
      columnSettings: { ...DEFAULT_COLUMN_SETTINGS },
      gridSettings: { ...DEFAULT_GRID_SETTINGS },
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(() => {
    const c = getCachedData<any>(CACHE_KEYS.FOOTER_EDITOR);
    return !(c && c.footer && Array.isArray(c.pages));
  });
  const [pages, setPages] = useState<{ _id: string; title: string; slug: string }[]>(() => {
    const c = getCachedData<any>(CACHE_KEYS.FOOTER_EDITOR);
    return Array.isArray(c?.pages) ? c.pages : [];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionEnabled, setNewSectionEnabled] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isSavingGrid, setIsSavingGrid] = useState(false);
  const [categories, setCategories] = useState<any[]>(() => {
    const c = getCachedData<any>(CACHE_KEYS.FOOTER_EDITOR);
    return Array.isArray(c?.categories) ? c.categories : [];
  });
  const [products, setProducts] = useState<any[]>(() => {
    const c = getCachedData<any>(CACHE_KEYS.FOOTER_EDITOR);
    return Array.isArray(c?.products) ? c.products : [];
  });
  const [companyPreview, setCompanyPreview] = useState<any>(() => {
    return getCachedData<any>(CACHE_KEYS.COMPANY);
  });
  const [draggingContactField, setDraggingContactField] = useState<ContactFieldKey | null>(null);
  const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [draggingLink, setDraggingLink] = useState<{
    sectionIndex: number;
    linkIndex: number;
  } | null>(null);

  const loadFooter = async () => {
    try {
      const data = await getFooter();
      let sections = data.sections || [];
      if (sections.length === 0) {
        const footerPages = await getEnabledWebPagesByLocation("footer");
        if (footerPages && footerPages.length > 0) {
          sections = [{
            title: "Quick Links",
            links: footerPages.map((p: any, idx: number) => ({
              label: p.title,
              url: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
              order: idx,
            })),
            order: 0,
            enabled: true,
          }];
          try {
            await updateFooter({ ...data, sections, showPreview: data.showPreview !== false });
          } catch (e) {
            console.error("Failed to auto-create footer sections:", e);
          }
        }
      }
      const normalized = normalizeFooterSettings(data);
      const footerState = {
        ...data,
        sections: sections.map((s: FooterSection) => ({ ...s, enabled: s.enabled !== false })),
        showPreview: data.showPreview === undefined || data.showPreview === null ? true : (data.showPreview === true || data.showPreview === "true"),
        ...normalized,
      };
      setFooter(footerState);
      return footerState;
    } catch (error) {
      console.error("Failed to load footer:", error);
      return null;
    }
  };

  const loadPages = async () => {
    try {
      const data = await getEnabledWebPagesByLocation("footer");
      const list = data || [];
      setPages(list);
      return list;
    } catch (err) {
      console.error("Failed to load footer pages:", err);
      return [];
    }
  };

  useEffect(() => {
    const hasCache = !!(getCachedData(CACHE_KEYS.FOOTER_EDITOR) as any)?.footer;
    const loadAll = async () => {
      if (!hasCache) setInitialLoading(true);
      try {
        const [cats, prods, footerState, pagesData, companyData] = await Promise.all([
          getCategories().catch(() => []),
          getProducts().catch(() => []),
          loadFooter(),
          loadPages(),
          getCompany().catch(() => null),
        ]);
        setCategories(cats || []);
        setProducts(prods || []);
        if (companyData) setCompanyPreview(companyData);
        if (footerState && Array.isArray(pagesData)) {
          setCachedData(CACHE_KEYS.FOOTER_EDITOR, { footer: footerState, pages: pagesData, categories: cats || [], products: prods || [] });
        }
      } catch (e) {
        console.error("Footer load error:", e);
      } finally {
        setInitialLoading(false);
      }
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Debug: log what we're saving
      console.log("Saving footer with showPreview:", footer.showPreview, "type:", typeof footer.showPreview);
      
      // Explicitly include showPreview - convert to boolean explicitly
      const showPreviewValue = footer.showPreview === true || (typeof footer.showPreview === "string" && footer.showPreview === "true") || (typeof footer.showPreview === "number" && footer.showPreview === 1);
      
      const saveData = {
        sections: footer.sections,
        socialLinks: footer.socialLinks,
        copyright: footer.copyright,
        description: footer.description,
        showPreview: showPreviewValue, // Explicitly set as boolean
        showCategories: footer.showCategories || false,
        showProducts: footer.showProducts || false,
        showSocialIcons: footer.showSocialIcons || false,
        showSocialLinks: footer.showSocialLinks || false,
        showSocialGallery: footer.showSocialGallery !== false,
        showContact: footer.showContact || false,
        contactInfo: footer.contactInfo || { ...DEFAULT_CONTACT_INFO },
        contactFieldOrder: footer.contactFieldOrder || [...DEFAULT_CONTACT_FIELD_ORDER],
        columnOrder: normalizeFooterColumnOrder(footer.columnOrder, footer.sections.length),
        columnSettings: footer.columnSettings || { ...DEFAULT_COLUMN_SETTINGS },
        gridSettings: footer.gridSettings || { ...DEFAULT_GRID_SETTINGS },
      };
      
      console.log("Sending to backend - showPreview:", showPreviewValue, "full data:", JSON.stringify(saveData));
      const result = await updateFooter(saveData);
      console.log("Backend response:", result);
      
      removeCachedData(CACHE_KEYS.FOOTER);
      removeCachedData(CACHE_KEYS.FOOTER_EDITOR);
      success("Footer settings saved successfully!");
      
      // Reload to verify it was saved
      await loadFooter();
    } catch (err) {
      console.error("Failed to save footer:", err);
      error("Failed to save footer settings");
    } finally {
      setIsLoading(false);
    }
  };

  const addSectionFromSelection = () => {
    if (selectedPageIds.size === 0) {
      error("Select at least one page");
      return;
    }
    if (!newSectionTitle.trim()) {
      error("Please enter a group name");
      return;
    }
    const newLinks = pages
      .filter((p) => selectedPageIds.has(p._id))
      .map((p, idx) => ({
        label: p.title,
        url: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
        order: idx,
      }));

    setFooter((prev) => {
      const newIndex = prev.sections.length;
      const newColumnId = getSectionColumnId(newIndex);
      const columnOrder = normalizeFooterColumnOrder(prev.columnOrder, prev.sections.length);
      const nextOrder = columnOrder.includes(newColumnId)
        ? columnOrder
        : [...columnOrder, newColumnId];
      return {
        ...prev,
        sections: [
          ...prev.sections,
          {
            title: newSectionTitle.trim(),
            links: newLinks,
            order: prev.sections.length,
            enabled: newSectionEnabled,
          },
        ],
        columnOrder: normalizeFooterColumnOrder(nextOrder, newIndex + 1),
      };
    });
    setSelectedPageIds(new Set());
    setNewSectionEnabled(true);
    setNewSectionTitle("");
    setShowAddModal(false);
  };

  const updateSection = (index: number, field: string, value: any) => {
    const newSections = [...footer.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setFooter({ ...footer, sections: newSections });
  };

  const addLinkToSection = (sectionIndex: number) => {
    const newSections = [...footer.sections];
    newSections[sectionIndex].links.push({
      label: "Page 1",
      url: "/",
      order: newSections[sectionIndex].links.length,
    });
    setFooter({ ...footer, sections: newSections });
  };

  const updateLink = (sectionIndex: number, linkIndex: number, field: string, value: string) => {
    const newSections = [...footer.sections];
    newSections[sectionIndex].links[linkIndex] = {
      ...newSections[sectionIndex].links[linkIndex],
      [field]: value,
    };
    setFooter({ ...footer, sections: newSections });
  };

  const removeLink = (sectionIndex: number, linkIndex: number) => {
    const newSections = [...footer.sections];
    newSections[sectionIndex].links.splice(linkIndex, 1);
    newSections[sectionIndex].links = newSections[sectionIndex].links.map((link, i) => ({
      ...link,
      order: i,
    }));
    setFooter({ ...footer, sections: newSections });
  };

  const reorderLinks = (sectionIndex: number, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newSections = [...footer.sections];
    const links = [...newSections[sectionIndex].links];
    const [moved] = links.splice(fromIndex, 1);
    links.splice(toIndex, 0, moved);
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      links: links.map((link, i) => ({ ...link, order: i })),
    };
    setFooter({ ...footer, sections: newSections });
  };

  const removeSection = (index: number) => {
    const newSections = footer.sections.filter((_, i) => i !== index);
    const columnOrder = normalizeFooterColumnOrder(
      reindexFooterColumnOrder(footer.columnOrder, index),
      newSections.length
    );
    setFooter({ ...footer, sections: newSections, columnOrder });
  };

  const toggleSectionEnabled = (index: number) => {
    const newSections = [...footer.sections];
    newSections[index] = { ...newSections[index], enabled: newSections[index].enabled === false ? true : false };
    setFooter({ ...footer, sections: newSections });
  };

  const updateContactInfo = (field: keyof typeof DEFAULT_CONTACT_INFO, value: string) => {
    setFooter({
      ...footer,
      contactInfo: {
        ...footer.contactInfo,
        [field]: value,
      },
    });
  };

  const importContactFromCompany = () => {
    if (!companyPreview) return;
    setFooter({
      ...footer,
      contactInfo: {
        ...footer.contactInfo,
        supportEmail: companyPreview.supportEmail || footer.contactInfo.supportEmail,
        email: companyPreview.email || footer.contactInfo.email,
        phone: companyPreview.phone || footer.contactInfo.phone,
        address: companyPreview.address || footer.contactInfo.address,
      },
    });
  };

  const reorderContactFields = (fromKey: ContactFieldKey, toKey: ContactFieldKey) => {
    if (fromKey === toKey) return;
    setFooter((prev) => {
      const order = [...prev.contactFieldOrder];
      const fromIndex = order.indexOf(fromKey);
      const toIndex = order.indexOf(toKey);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      return { ...prev, contactFieldOrder: order };
    });
  };

  const reorderSections = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFooter((prev) => {
      const sections = [...prev.sections];
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return {
        ...prev,
        sections: sections.map((section, index) => ({ ...section, order: index })),
      };
    });
  };

  const reorderFooterColumns = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setFooter((prev) => {
      const order = [...prev.columnOrder];
      const fromIndex = order.indexOf(fromId);
      const toIndex = order.indexOf(toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      return { ...prev, columnOrder: order };
    });
  };

  const previewContactEntries = useMemo(
    () => getOrderedContactEntries(footer.contactInfo, footer.contactFieldOrder),
    [footer.contactInfo, footer.contactFieldOrder]
  );

  const normalizeSlug = (url: string) => {
    if (!url) return "";
    try {
      // strip domain if absolute
      const u = new URL(url, "http://placeholder");
      return u.pathname.replace(/\/+$/, "") || "/";
    } catch {
      return url.replace(/\/+$/, "") || "/";
    }
  };

  const usedPageIds = useMemo(() => {
    return new Set<string>(
      footer.sections.flatMap((section) =>
        section.links
          .map((link) => {
            const linkPath = normalizeSlug(link.url);
            const match = pages.find((p) => {
              const pagePath = normalizeSlug(p.slug.startsWith("/") ? p.slug : `/${p.slug}`);
              return pagePath === linkPath;
            });
            return match?._id || "";
          })
          .filter(Boolean)
      )
    );
  }, [footer.sections, pages]);

  useEffect(() => {
    if (showAddModal) {
      setSelectedPageIds(new Set());
      setNewSectionEnabled(true);
      setNewSectionTitle("");
    }
  }, [showAddModal]);

  const previewSocialPosts = useMemo(() => {
    const posts = (companyPreview?.socialPosts || [])
      .filter((post: any) => post?.image && String(post.image).trim() !== "")
      .slice(0, footer.columnSettings.socialGalleryCount);
    return posts;
  }, [companyPreview, footer.columnSettings.socialGalleryCount]);

  const previewColumnGrid =
    FOOTER_COLUMN_GRID[footer.gridSettings.footerColumnsPerRow] || FOOTER_COLUMN_GRID[4];

  const resolvedColumnOrder = useMemo(
    () => normalizeFooterColumnOrder(footer.columnOrder, footer.sections.length),
    [footer.columnOrder, footer.sections.length]
  );

  const isPreviewColumnVisible = (columnId: string) => {
    if (columnId === "categories") return footer.showCategories && categories.length > 0;
    if (columnId === "products") return footer.showProducts && products.length > 0;
    if (columnId === "contact") return footer.showContact && previewContactEntries.length > 0;
    if (columnId === "socialLinks") return footer.showSocialLinks;
    if (columnId === "socialGallery") return footer.showSocialGallery && previewSocialPosts.length > 0;
    if (columnId.startsWith("section-")) {
      const idx = Number.parseInt(columnId.replace("section-", ""), 10);
      const section = footer.sections[idx];
      return !!section && section.enabled !== false;
    }
    return false;
  };

  const renderPreviewColumn = (columnId: string) => {
    if (!isPreviewColumnVisible(columnId)) return null;

    if (columnId === "categories") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.slice(0, footer.columnSettings.categoriesCount).map((cat: any) => (
              <span key={cat._id} className="block text-gray-100 text-sm">
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (columnId === "products") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg mb-3">Products</h3>
          <div className="space-y-2">
            {products.slice(0, footer.columnSettings.productsCount).map((prod: any) => (
              <span key={prod._id} className="block text-gray-100 text-sm">
                {prod.name}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (columnId === "contact") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg mb-3">
            {footer.contactInfo.title || "Contact"}
          </h3>
          <div className="space-y-2 text-sm text-gray-100">
            {previewContactEntries.map((entry) => (
              <p key={entry.key} className={entry.key === "address" ? "leading-relaxed" : ""}>
                {entry.value}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (columnId === "socialLinks") {
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg mb-3">Follow Us</h3>
          <LandingSocialIconButtons
            links={companyPreview?.socialLinks || {}}
            useDefaults={false}
            className="justify-start"
          />
        </div>
      );
    }

    if (columnId === "socialGallery") {
      return (
        <div key={columnId}>
          <div className="grid grid-cols-4 gap-2 max-w-xs">
            {previewSocialPosts.map((post: any, index: number) => (
              <div
                key={index}
                className="aspect-square rounded overflow-hidden bg-gray-700"
              >
                <img
                  src={post.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (columnId.startsWith("section-")) {
      const idx = Number.parseInt(columnId.replace("section-", ""), 10);
      const section = footer.sections[idx];
      if (!section) return null;
      return (
        <div key={columnId}>
          <h3 className="text-white font-semibold text-lg mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.links
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((link, linkIndex) => (
              <span key={linkIndex} className="block text-gray-100 text-sm">
                {link.label}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold theme-heading">Footer</h1>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 theme-button"
        >
          {isLoading && <CircularLoader size={16} color="white" />}
          <Save size={18} />
          Save Changes
        </button>
      </div>

      {/* Footer Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {footer.sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
              draggingSectionIndex === sectionIndex ? "ring-2 ring-[var(--theme-primary)]" : ""
            }`}
            onDragOver={(e) => {
              if (draggingLink) return;
              e.preventDefault();
              if (draggingSectionIndex === null || draggingSectionIndex === sectionIndex) return;
              reorderSections(draggingSectionIndex, sectionIndex);
              setDraggingSectionIndex(sectionIndex);
            }}
            onDragEnd={() => setDraggingSectionIndex(null)}
          >
            <div
              className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2 min-w-0"
              draggable
              onDragStart={() => setDraggingSectionIndex(sectionIndex)}
              onDragEnd={() => setDraggingSectionIndex(null)}
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0" aria-label="Drag to reorder" />
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, "title", e.target.value)}
                  className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0"
                  style={{ color: "#111827" }}
                />
              <label className="flex items-center gap-1 text-sm text-gray-600 shrink-0 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={section.enabled !== false}
                  onChange={() => toggleSectionEnabled(sectionIndex)}
                  className="w-4 h-4 border-gray-300 rounded"
                  style={{ accentColor: "var(--theme-primary)" }}
                />
                <span>Show</span>
              </label>
              <button
                onClick={() => removeSection(sectionIndex)}
                className="p-1 text-gray-400 hover:text-red-500 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {section.links.map((link, linkIndex) => {
                const isDraggingLink =
                  draggingLink?.sectionIndex === sectionIndex &&
                  draggingLink?.linkIndex === linkIndex;
                return (
                  <div
                    key={`${sectionIndex}-${linkIndex}-${link.url}`}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggingLink({ sectionIndex, linkIndex });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!draggingLink || draggingLink.sectionIndex !== sectionIndex) return;
                      if (draggingLink.linkIndex === linkIndex) return;
                      reorderLinks(sectionIndex, draggingLink.linkIndex, linkIndex);
                      setDraggingLink({ sectionIndex, linkIndex });
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      setDraggingLink(null);
                    }}
                    className={`flex items-center gap-2 min-w-0 p-1.5 rounded-lg border ${
                      isDraggingLink
                        ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_8%,white)]"
                        : "border-transparent hover:border-gray-200"
                    }`}
                  >
                    <GripVertical
                      className="w-4 h-4 text-gray-400 cursor-grab shrink-0"
                      aria-label="Drag to reorder link"
                    />
                    <input
                      type="text"
                      value={link.label}
                      draggable={false}
                      onChange={(e) => updateLink(sectionIndex, linkIndex, "label", e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded outline-none min-w-0 text-gray-900"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--theme-primary)";
                        e.currentTarget.style.boxShadow = "0 0 0 1px var(--theme-primary)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "";
                        e.currentTarget.style.boxShadow = "";
                      }}
                      placeholder="Link label"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(sectionIndex, linkIndex)}
                      className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {section.links.length === 0 && (
                <p className="text-sm text-gray-400">No links yet</p>
              )}
              <button
                onClick={() => addLinkToSection(sectionIndex)}
                className="flex items-center gap-1 text-sm font-medium mt-2"
                style={{ color: "var(--theme-primary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--theme-dark)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--theme-primary)";
                }}
              >
                <Plus size={16} />
                Add Link
              </button>
            </div>
          </div>
        ))}

        {/* Add Section Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-colors"
          style={{ borderColor: "border-gray-300" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "";
          }}
        >
          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Add Section</p>
        </button>
      </div>

      {/* Permanent Columns - Categories and Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold theme-heading">Permanent Columns</h2>
          <p className="text-sm text-gray-600 mt-1">Show popular categories and products in footer</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Categories Column */}
          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Categories</h3>
                  <p className="text-xs text-gray-500">Show popular categories</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={footer.showCategories}
                  onChange={(e) => setFooter({ ...footer, showCategories: e.target.checked })}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    backgroundColor: footer.showCategories ? "var(--theme-primary)" : "#E5E7EB",
                  }}
                />
              </label>
            </div>
            {footer.showCategories && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Show how many categories</label>
                <select
                  value={footer.columnSettings.categoriesCount}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      columnSettings: {
                        ...footer.columnSettings,
                        categoriesCount: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  {[3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Products Column */}
          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Products</h3>
                  <p className="text-xs text-gray-500">Show popular products</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={footer.showProducts}
                  onChange={(e) => setFooter({ ...footer, showProducts: e.target.checked })}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    backgroundColor: footer.showProducts ? "var(--theme-primary)" : "#E5E7EB",
                  }}
                />
              </label>
            </div>
            {footer.showProducts && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Show how many products</label>
                <select
                  value={footer.columnSettings.productsCount}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      columnSettings: {
                        ...footer.columnSettings,
                        productsCount: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  {[3, 4, 5, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Contact Column */}
          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Contact</h3>
                  <p className="text-xs text-gray-500">Email, phone & address — edit below</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={footer.showContact}
                  onChange={(e) => setFooter({ ...footer, showContact: e.target.checked })}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    backgroundColor: footer.showContact ? "var(--theme-primary)" : "#E5E7EB",
                  }}
                />
              </label>
            </div>
            {footer.showContact && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Column title</label>
                  <input
                    type="text"
                    value={footer.contactInfo.title}
                    onChange={(e) => updateContactInfo("title", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    placeholder="Contact"
                  />
                </div>
                <p className="text-xs text-gray-500">Drag fields to change display order in footer.</p>
                <div className="space-y-2">
                  {footer.contactFieldOrder.map((fieldKey) => (
                    <div
                      key={fieldKey}
                      draggable
                      onDragStart={() => setDraggingContactField(fieldKey)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!draggingContactField || draggingContactField === fieldKey) return;
                        reorderContactFields(draggingContactField, fieldKey);
                        setDraggingContactField(fieldKey);
                      }}
                      onDragEnd={() => setDraggingContactField(null)}
                      className={`flex items-start gap-2 p-2 rounded-lg border ${
                        draggingContactField === fieldKey
                          ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_8%,white)]"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0 mt-2" />
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {CONTACT_FIELD_LABELS[fieldKey]}
                        </label>
                        {fieldKey === "address" ? (
                          <textarea
                            value={footer.contactInfo.address}
                            onChange={(e) => updateContactInfo("address", e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-y"
                            placeholder="Street, city, country"
                          />
                        ) : (
                          <input
                            type={fieldKey === "phone" ? "tel" : "email"}
                            value={footer.contactInfo[fieldKey]}
                            onChange={(e) => updateContactInfo(fieldKey, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder={CONTACT_FIELD_LABELS[fieldKey]}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {companyPreview && (
                  <button
                    type="button"
                    onClick={importContactFromCompany}
                    className="text-xs font-medium"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    Import from Company
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Social Gallery */}
          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Image className="w-5 h-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Social Gallery</h3>
                  <p className="text-xs text-gray-500">Show images from company social posts</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={footer.showSocialGallery}
                  onChange={(e) => setFooter({ ...footer, showSocialGallery: e.target.checked })}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    backgroundColor: footer.showSocialGallery ? "var(--theme-primary)" : "#E5E7EB",
                  }}
                />
              </label>
            </div>
            {footer.showSocialGallery && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Show how many images</label>
                <select
                  value={footer.columnSettings.socialGalleryCount}
                  onChange={(e) =>
                    setFooter({
                      ...footer,
                      columnSettings: {
                        ...footer.columnSettings,
                        socialGalleryCount: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  {[4, 6, 8, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Column Order */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold theme-heading">Footer Column Order</h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag columns to reorder. Company info always stays first — move Contact to last if needed.
          </p>
        </div>
        <div className="p-6 space-y-2">
          {resolvedColumnOrder.map((columnId) => (
            <div
              key={columnId}
              draggable
              onDragStart={() => setDraggingColumnId(columnId)}
              onDragOver={(e) => {
                e.preventDefault();
                if (!draggingColumnId || draggingColumnId === columnId) return;
                reorderFooterColumns(draggingColumnId, columnId);
                setDraggingColumnId(columnId);
              }}
              onDragEnd={() => setDraggingColumnId(null)}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                draggingColumnId === columnId
                  ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_8%,white)]"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab shrink-0" />
              <span className="text-sm font-medium text-gray-900">
                {getFooterColumnLabel(columnId, footer.sections)}
              </span>
              {!isPreviewColumnVisible(columnId) && (
                <span className="text-xs text-gray-500 ml-auto">Hidden</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Social Icons and Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold theme-heading">Social Media</h2>
          <p className="text-sm text-gray-600 mt-1">Manage social icons and links display in footer</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Social Icons */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <PanelBottom className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Social Icons</h3>
                <p className="text-xs text-gray-500">Show icons under company name</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={footer.showSocialIcons}
                onChange={(e) => setFooter({ ...footer, showSocialIcons: e.target.checked })}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  backgroundColor: footer.showSocialIcons ? "var(--theme-primary)" : "#E5E7EB",
                  boxShadow: footer.showSocialIcons ? "0 0 0 2px color-mix(in srgb, var(--theme-primary) 30%, transparent)" : "none",
                }}
              />
            </label>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <PanelBottom className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Social Links</h3>
                <p className="text-xs text-gray-500">Show links column with platform names</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={footer.showSocialLinks}
                onChange={(e) => setFooter({ ...footer, showSocialLinks: e.target.checked })}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-2px after:left-2px after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  backgroundColor: footer.showSocialLinks ? "var(--theme-primary)" : "#E5E7EB",
                  boxShadow: footer.showSocialLinks ? "0 0 0 2px color-mix(in srgb, var(--theme-primary) 30%, transparent)" : "none",
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Grid Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold theme-heading">Grid Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Control the number of items displayed per row on the site</p>
          </div>
          <button
            onClick={async () => {
              setIsSavingGrid(true);
              try {
                await handleSave();
                success("Grid settings saved successfully!");
              } catch (err) {
                error("Failed to save grid settings");
              } finally {
                setIsSavingGrid(false);
              }
            }}
            disabled={isSavingGrid || initialLoading}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 theme-button"
          >
            {isSavingGrid && <CircularLoader size={16} color="white" />}
            <Save size={18} />
            Save
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Footer Row Columns */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PanelBottom size={18} />
              Footer Row Columns
            </h3>
            <div className="flex gap-3">
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() =>
                    setFooter({
                      ...footer,
                      gridSettings: { ...footer.gridSettings, footerColumnsPerRow: num },
                    })
                  }
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    footer.gridSettings.footerColumnsPerRow === num
                      ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_10%,white)]"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  title={`${num} columns`}
                >
                  <GridIcon count={num} isSelected={footer.gridSettings.footerColumnsPerRow === num} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart size={18} />
              Product Grid
            </h3>
            <div className="flex gap-3">
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setFooter({ 
                    ...footer, 
                    gridSettings: { ...footer.gridSettings, productsPerRow: num } 
                  })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    footer.gridSettings.productsPerRow === num
                      ? "border-var(--theme-primary) bg-var(--theme-primary)/10"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  title={`${num} columns`}
                >
                  <GridIcon count={num} isSelected={footer.gridSettings.productsPerRow === num} />
                </button>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} />
              Blog Grid
            </h3>
            <div className="flex gap-3">
              {[3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setFooter({ 
                    ...footer, 
                    gridSettings: { ...footer.gridSettings, blogsPerRow: num } 
                  })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    footer.gridSettings.blogsPerRow === num
                      ? "border-var(--theme-primary) bg-var(--theme-primary)/10"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  title={`${num} columns`}
                >
                  <GridIcon count={num} isSelected={footer.gridSettings.blogsPerRow === num} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold theme-heading">Footer Preview</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={footer.showPreview}
              onChange={(e) => setFooter({ ...footer, showPreview: e.target.checked })}
              className="w-4 h-4 border-gray-300 rounded"
              style={{ accentColor: "var(--theme-primary)" }}
            />
            <span className="text-sm text-gray-700">Show Footer Preview</span>
          </label>
        </div>
        {footer.showPreview && (
          <div className="p-4">
            <div
              className="rounded-lg overflow-hidden text-gray-100"
              style={{ backgroundColor: "var(--theme-dark, #6B4A2C)" }}
            >
              <div className="px-6 py-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  <div className="flex-1 min-w-0">
                    <div className={`grid grid-cols-1 gap-8 ${previewColumnGrid}`}>
                      <div>
                        <h2 className="text-2xl font-semibold text-white">
                          {companyPreview?.company || "Company"}
                        </h2>
                        <p className="text-gray-100 text-sm mt-3 max-w-xl">
                          {companyPreview?.description ||
                            "Company description will appear here."}
                        </p>
                        {footer.showSocialIcons && (
                          <LandingSocialIconButtons
                            links={companyPreview?.socialLinks || {}}
                            useDefaults={false}
                            className="mt-6 justify-start"
                          />
                        )}
                      </div>

                      {resolvedColumnOrder.map((columnId) => renderPreviewColumn(columnId))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100/30 py-4 px-6">
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-100 gap-2">
                  <span>
                    {companyPreview?.copyright?.trim() ||
                      footer.copyright?.trim() ||
                      `© ${new Date().getFullYear()} ${companyPreview?.company || "Company"}. All rights reserved.`}
                  </span>
                  <span className="opacity-90">
                    Join {companyPreview?.company || "Company"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Footer Column</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSectionEnabled}
                  onChange={(e) => setNewSectionEnabled(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded"
                  style={{ accentColor: "var(--theme-primary)" }}
                />
                <span className="text-sm text-gray-700">Show this column</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Enter group name (e.g., Quick Links, Support, etc.)"
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--theme-primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(var(--theme-primary-rgb), 0.2)";
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.value.trim()) {
                      e.currentTarget.style.borderColor = "#ef4444";
                    } else {
                      e.currentTarget.style.borderColor = "";
                    }
                    e.currentTarget.style.boxShadow = "";
                  }}
                  autoFocus
                />
                {!newSectionTitle.trim() && (
                  <p className="text-xs text-red-500 mt-1">Group name is required</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Choose pages to include</h4>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {pages.map((page) => {
                    const disabled = usedPageIds.has(page._id);
                    const checked = selectedPageIds.has(page._id);
                    return (
                      <label
                        key={page._id}
                        className={`flex items-center gap-2 text-sm ${disabled ? "text-gray-400" : "text-gray-800"}`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(selectedPageIds);
                            if (e.target.checked) next.add(page._id);
                            else next.delete(page._id);
                            setSelectedPageIds(next);
                          }}
                          className="w-4 h-4 border-gray-300 rounded"
                          style={{ accentColor: "var(--theme-primary)" }}
                        />
                        <span>{page.title}</span>
                        {disabled && <span className="text-xs text-gray-400">(already in another column)</span>}
                      </label>
                    );
                  })}
                  {pages.length === 0 && <p className="text-sm text-gray-500">No pages available.</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addSectionFromSelection}
                  className="px-4 py-2 text-sm text-white rounded-lg flex items-center gap-2 theme-button"
                >
                  <Plus size={16} />
                  Add Column
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
