import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { RichTextEditor } from "@mantine/rte";
import { getBanners, updateBanner, type Banner, type BannerSlot, BANNER_SLOT_SIZES, HERO_BANNER_ASPECT } from "@/api/banner.api";
import {
  getBanners2,
  updateBanner2,
  type Banner2,
  type Banner2Slot,
  BANNER2_SLOT_SIZES,
} from "@/api/banner2.api";
import { removeCachedData, CACHE_KEYS } from "@/utils/cache";
import { setLoginBannerUrl, clearLoginBannerUrl } from "@/utils/authBanner";
import {
  getPolicies,
  createPolicy,
  setPolicyEnabled,
  deletePolicy,
  updateContent,
  getContentByType,
  type ContentPage,
} from "@/api/content.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContentPageEditorPanel from "@/components/admin/assets/ContentPageEditorPanel";
import { useToast } from "@/components/ui/toast";
import FilterTabs from "@/components/ui/FilterTabs";
import ImageCropperModal from "@/components/admin/product/ImageCropperModal";
import AssetMediaPickerField from "@/components/admin/media/AssetMediaPickerField";
import {
  DEFAULT_POLICY_PAGES,
  mapPoliciesToConfig,
  isPolicyTab,
  notifyPoliciesUpdated,
  type PolicyPageConfig,
} from "@/config/policyPages";

// Helper function to preserve alignment styles from RichTextEditor
const processAlignmentStyles = (html: string): string => {
  if (!html) return html;
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Find all elements with Quill alignment classes
  const elements = tempDiv.querySelectorAll('[class*="ql-align"]');
  
  elements.forEach((el) => {
    const element = el as HTMLElement;
    const classes = element.className;
    
    // Determine alignment from class
    let alignment = '';
    if (classes.includes('ql-align-center')) {
      alignment = 'center';
    } else if (classes.includes('ql-align-right')) {
      alignment = 'right';
    } else if (classes.includes('ql-align-justify')) {
      alignment = 'justify';
    } else if (classes.includes('ql-align-left')) {
      alignment = 'left';
    }
    
    if (alignment) {
      // Get existing style attribute
      const existingStyle = element.getAttribute('style') || '';
      // Remove any existing text-align from style
      const cleanedStyle = existingStyle.replace(/text-align\s*:\s*[^;]+;?/gi, '').trim();
      // Add text-align to style
      const newStyle = cleanedStyle 
        ? `${cleanedStyle}; text-align: ${alignment};`
        : `text-align: ${alignment};`;
      element.setAttribute('style', newStyle);
      // Remove Quill alignment classes
      element.className = element.className
        .replace(/\s*ql-align-(center|right|justify|left)\s*/g, ' ')
        .trim();
    }
  });
  
  return tempDiv.innerHTML;
};

type TabType = string;

const ASSET_TABS = ["banners", "banner2", "faq"] as const;

function tabFromSearchParam(tab: string | null): TabType {
  if (!tab) return "banners";
  if ((ASSET_TABS as readonly string[]).includes(tab)) return tab;
  if (/^[a-z][a-z0-9-]{1,48}$/.test(tab)) return tab;
  return "banners";
}

const getBannerAspect = (slot: BannerSlot | string): number => {
  if (slot === "about-us") return 4 / 3;
  if (slot === "login") return 16 / 9;
  if (slot === "shop-main") return 1080 / 280;
  if (slot === "hero-main" || slot === "hero-secondary" || slot === "hero-tertiary") {
    return HERO_BANNER_ASPECT;
  }
  return 16 / 9;
};

const isBrandPromoSlot = (slot: BannerSlot | string) =>
  slot === "brand-promo-1" || slot === "brand-promo-2";

const isVideoMediaUrl = (url?: string | null) => {
  const v = String(url || "").toLowerCase();
  return v.endsWith(".mp4") || v.endsWith(".webm") || v.endsWith(".ogg") || v.includes("video/upload");
};

type BannerFormFields = {
  targetUrl: string;
  imageFile: File | null;
  imagePreview: string | null;
  /** When true, next save clears stored image on the server */
  clearImage?: boolean;
};

const createInitialBannerFormData = (): Record<BannerSlot, BannerFormFields> => ({
  "hero-main": { targetUrl: "", imageFile: null, imagePreview: null },
  "hero-secondary": { targetUrl: "", imageFile: null, imagePreview: null },
  "hero-tertiary": { targetUrl: "", imageFile: null, imagePreview: null },
  "hero-last": { targetUrl: "", imageFile: null, imagePreview: null },
  "shop-main": { targetUrl: "", imageFile: null, imagePreview: null },
  "about-us": { targetUrl: "", imageFile: null, imagePreview: null },
  login: { targetUrl: "", imageFile: null, imagePreview: null },
  "brand-promo-1": { targetUrl: "", imageFile: null, imagePreview: null },
  "brand-promo-2": { targetUrl: "", imageFile: null, imagePreview: null },
});

// Aspect ratios for Banner2 slots, matching how images are rendered on SecondLanding
const getBanner2Aspect = (slot: Banner2Slot | string): number => {
  switch (slot) {
    case "hero-bg":
      // Full-width hero background (HeroBannerFull) – 21:9
      return 21 / 9;
    case "hero-right":
      // Right-side hero card image – square
      return 1;
    case "cta-bg":
      // Call To Action full-width background – 16:9 works well
      return 16 / 9;
    case "hero-business":
      // HeroBannerBusiness image – 16:9 container
      return 16 / 9;
    case "unlock-image":
      // UnlockPotentialSection image – 16:9 container
      return 16 / 9;
    case "feature-1":
    case "feature-2":
    case "text-image":
      // FeaturesDetailsSection and TextImageSection – 3:2 image cards
      return 3 / 2;
    case "detail-hero":
      // DetailWithLeftSidebar hero image – 16:9
      return 16 / 9;
    case "about-1":
    case "about-2":
    case "about-3":
    case "about-4":
      // PortfolioDetailSection image gallery – 1:1
      return 1;
    case "team-1":
    case "team-2":
    case "team-3":
    case "team-4":
      // TeamCard portrait area – 1:1
      return 1;
    default:
      // Sensible default for any future slots
      return 16 / 9;
  }
};

export default function AssetsPage() {
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(() =>
    tabFromSearchParam(searchParams.get("tab"))
  );
  
  // Edit mode states
  const [editingBannerSlot, setEditingBannerSlot] = useState<BannerSlot | null>(null);
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [isEditingFAQ, setIsEditingFAQ] = useState(false);
  
  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerFormData, setBannerFormData] = useState<Record<BannerSlot, BannerFormFields>>(createInitialBannerFormData);
  const [bannerOriginalData, setBannerOriginalData] = useState<Record<BannerSlot, BannerFormFields>>(createInitialBannerFormData);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [currentBannerSlot, setCurrentBannerSlot] = useState<BannerSlot | null>(null);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);

  // Banner 2 state (second landing page images)
  const [banners2, setBanners2] = useState<Banner2[]>([]);
  const [banner2Loading, setBanner2Loading] = useState(false);
  const [banner2FormData, setBanner2FormData] = useState<Record<string, BannerFormFields>>({});
  const [banner2OriginalData, setBanner2OriginalData] = useState<Record<string, BannerFormFields>>({});
  const [editingBanner2Slot, setEditingBanner2Slot] = useState<Banner2Slot | string | null>(null);
  const [showBanner2Cropper, setShowBanner2Cropper] = useState(false);
  const [currentBanner2Slot, setCurrentBanner2Slot] = useState<Banner2Slot | string | null>(null);
  const [currentBanner2File, setCurrentBanner2File] = useState<File | null>(null);
  
  // Policy list + active policy editor
  const [policyPages, setPolicyPages] = useState<PolicyPageConfig[]>(DEFAULT_POLICY_PAGES);
  const [policyContent, setPolicyContent] = useState<ContentPage | null>(null);
  const [policyContentOriginal, setPolicyContentOriginal] = useState<ContentPage | null>(null);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [newPolicyLabel, setNewPolicyLabel] = useState("");
  const [creatingPolicy, setCreatingPolicy] = useState(false);

  const [faqContent, setFaqContent] = useState<ContentPage | null>(null);
  const [faqContentOriginal, setFaqContentOriginal] = useState<ContentPage | null>(null);
  
  const [contentLoading, setContentLoading] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  
  // FAQ state
  const [newFAQ, setNewFAQ] = useState({ question: "", answer: "" });
  const [editingFAQIndex, setEditingFAQIndex] = useState<number | null>(null);

  const activeIsPolicy = isPolicyTab(activeTab, policyPages);

  const refreshPolicyPages = async () => {
    try {
      const list = await getPolicies(false);
      setPolicyPages(mapPoliciesToConfig(list));
    } catch (err) {
      console.error("Failed to load policies:", err);
    }
  };

  useEffect(() => {
    refreshPolicyPages();
  }, []);

  // Keep tab in sync with ?tab= from sidebar Policies links
  useEffect(() => {
    const next = tabFromSearchParam(searchParams.get("tab"));
    setActiveTab((prev) => (prev === next ? prev : next));
    if (searchParams.get("add") === "1") {
      setShowAddPolicy(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("add");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    const next = tabFromSearchParam(tabId);
    setActiveTab(next);
    if (isPolicyTab(next, policyPages) || next === "faq") {
      setSearchParams({ tab: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Load banners
  useEffect(() => {
    if (activeTab === "banners") {
      loadBanners();
    }
  }, [activeTab]);

  // Load Banner 2
  useEffect(() => {
    if (activeTab === "banner2") {
      loadBanners2();
    }
  }, [activeTab]);

  // Load content
  useEffect(() => {
    if (activeIsPolicy || activeTab === "faq") {
      loadContent();
    }
    setIsEditingPolicy(false);
  }, [activeTab, activeIsPolicy]);

  const loadBanners = async () => {
    setBannerLoading(true);
    try {
      const data = await getBanners();
      setBanners(data);
      // Initialize form data with existing banners
      const initialData = createInitialBannerFormData();
      data.forEach((banner) => {
        if (banner.slot in initialData) {
          initialData[banner.slot as BannerSlot] = {
            targetUrl: banner.targetUrl || "",
            imageFile: null,
            imagePreview: banner.imageUrl,
            clearImage: false,
          };
        }
        if (banner.slot === "login" && banner.imageUrl) {
          setLoginBannerUrl(banner.imageUrl);
        }
      });
      setBannerFormData(initialData);
      setBannerOriginalData(JSON.parse(JSON.stringify(initialData)));
    } catch (err) {
      console.error("Failed to load banners:", err);
      error("Failed to load banners");
    } finally {
      setBannerLoading(false);
    }
  };

  const loadContent = async () => {
    setContentLoading(true);
    try {
      if (activeTab === "faq") {
        const data = await getContentByType("faqs");
        setFaqContent(data);
        setFaqContentOriginal(JSON.parse(JSON.stringify(data)));
      } else if (isPolicyTab(activeTab, policyPages)) {
        const data = await getContentByType(activeTab);
        setPolicyContent(data);
        setPolicyContentOriginal(JSON.parse(JSON.stringify(data)));
      }
    } catch (err) {
      console.error("Failed to load content:", err);
      error("Failed to load content");
      setPolicyContent(null);
    } finally {
      setContentLoading(false);
    }
  };

  const handleBannerImageSelect = (file: File, slot: BannerSlot) => {
    if (isBrandPromoSlot(slot) && file.type.startsWith("video/")) {
      const preview = URL.createObjectURL(file);
      setBannerFormData({
        ...bannerFormData,
        [slot]: {
          ...bannerFormData[slot],
          imageFile: file,
          imagePreview: preview,
          clearImage: false,
        },
      });
      return;
    }
    setCurrentBannerSlot(slot);
    setCurrentImageFile(file);
    setShowImageCropper(true);
  };

  const handleImageCrop = (croppedFile: File) => {
    if (!currentBannerSlot) return;
    const preview = URL.createObjectURL(croppedFile);
    setBannerFormData({
      ...bannerFormData,
      [currentBannerSlot]: {
        ...bannerFormData[currentBannerSlot],
        imageFile: croppedFile,
        imagePreview: preview,
        clearImage: false,
      },
    });
    setShowImageCropper(false);
    setCurrentBannerSlot(null);
  };

  const startEditBanner = (slot: BannerSlot) => {
    const banner = banners.find((b) => b.slot === slot);
    setBannerFormData({
      ...bannerFormData,
      [slot]: {
        targetUrl: banner?.targetUrl || "",
        imageFile: null,
        imagePreview: banner?.imageUrl || null,
        clearImage: false,
      },
    });
    setBannerOriginalData({
      ...bannerOriginalData,
      [slot]: {
        targetUrl: banner?.targetUrl || "",
        imageFile: null,
        imagePreview: banner?.imageUrl || null,
        clearImage: false,
      },
    });
    setEditingBannerSlot(slot);
  };

  const discardBanner = (slot: BannerSlot) => {
    setBannerFormData({
      ...bannerFormData,
      [slot]: { ...bannerOriginalData[slot] },
    });
    setEditingBannerSlot(null);
  };

  const saveBanner = async (slot: BannerSlot) => {
    try {
      const updated = await updateBanner(slot, {
        targetUrl: bannerFormData[slot].targetUrl,
        file: bannerFormData[slot].imageFile,
        clearImage: bannerFormData[slot].clearImage === true,
      });
      if (slot === "login") {
        if (updated.imageUrl) {
          setLoginBannerUrl(updated.imageUrl);
        } else {
          clearLoginBannerUrl();
          removeCachedData(CACHE_KEYS.LOGIN_BANNER);
        }
      }
      success("Banner updated successfully!");
      setEditingBannerSlot(null);
      setBannerFormData({
        ...bannerFormData,
        [slot]: {
          ...bannerFormData[slot],
          imageFile: null,
          clearImage: false,
        },
      });
      loadBanners();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update banner");
    }
  };

  const startEditPolicy = () => setIsEditingPolicy(true);

  const discardPolicy = () => {
    if (policyContentOriginal) {
      setPolicyContent(JSON.parse(JSON.stringify(policyContentOriginal)));
    }
    setIsEditingPolicy(false);
  };

  const updatePolicy = async () => {
    if (!policyContent || !activeIsPolicy) return;
    setSavingContent(true);
    try {
      const description = processAlignmentStyles(policyContent.description);
      await updateContent(activeTab, {
        title: policyContent.title,
        subTitle: policyContent.subTitle,
        description,
        enabled: policyContent.enabled !== false,
        label: policyContent.label,
        storePath: policyContent.storePath,
      });
      success("Policy updated successfully!");
      setIsEditingPolicy(false);
      await loadContent();
      await refreshPolicyPages();
      notifyPoliciesUpdated();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update policy");
    } finally {
      setSavingContent(false);
    }
  };

  const handleTogglePolicyEnabled = async (enabled: boolean) => {
    if (!activeIsPolicy) return;
    setTogglingEnabled(true);
    try {
      const updated = await setPolicyEnabled(activeTab, enabled);
      setPolicyContent(updated);
      setPolicyContentOriginal(JSON.parse(JSON.stringify(updated)));
      await refreshPolicyPages();
      notifyPoliciesUpdated();
      removeCachedData(CACHE_KEYS.FOOTER);
      success(enabled ? "Policy enabled" : "Policy disabled — hidden on storefront");
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update enabled status");
    } finally {
      setTogglingEnabled(false);
    }
  };

  const handleCreatePolicy = async () => {
    const label = newPolicyLabel.trim();
    if (!label) {
      error("Please enter a policy name");
      return;
    }
    setCreatingPolicy(true);
    try {
      const created = await createPolicy({ label, enabled: true });
      success(`${created.label || label} created`);
      setShowAddPolicy(false);
      setNewPolicyLabel("");
      await refreshPolicyPages();
      notifyPoliciesUpdated();
      removeCachedData(CACHE_KEYS.FOOTER);
      setSearchParams({ tab: created.type }, { replace: true });
      setActiveTab(created.type);
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to create policy");
    } finally {
      setCreatingPolicy(false);
    }
  };

  const canDeleteActivePolicy = activeIsPolicy;

  const handleDeletePolicy = async () => {
    if (!activeIsPolicy || !canDeleteActivePolicy) return;
    const name =
      policyPages.find((p) => p.id === activeTab)?.label ||
      policyContent?.label ||
      policyContent?.title ||
      activeTab;
    const ok = window.confirm(
      `Delete "${name}"? This permanently removes the policy page and cannot be undone.`
    );
    if (!ok) return;

    setDeletingPolicy(true);
    try {
      await deletePolicy(activeTab);
      success(`"${name}" deleted`);
      setPolicyContent(null);
      setPolicyContentOriginal(null);
      setIsEditingPolicy(false);
      const remaining = (await getPolicies(false)).filter((p) => p.type !== activeTab);
      setPolicyPages(mapPoliciesToConfig(remaining));
      notifyPoliciesUpdated();
      removeCachedData(CACHE_KEYS.FOOTER);
      const nextTab = remaining[0]?.type || "privacy";
      setSearchParams({ tab: nextTab }, { replace: true });
      setActiveTab(nextTab);
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to delete policy");
    } finally {
      setDeletingPolicy(false);
    }
  };

  const startEditFAQ = () => {
    setIsEditingFAQ(true);
  };

  const discardFAQ = () => {
    if (faqContentOriginal) {
      setFaqContent(JSON.parse(JSON.stringify(faqContentOriginal)));
    }
    setNewFAQ({ question: "", answer: "" });
    setEditingFAQIndex(null);
    setIsEditingFAQ(false);
  };

  const updateFAQ = async () => {
    if (!faqContent) return;
    setSavingContent(true);
    try {
      // Process alignment styles in FAQ answers before saving
      const faqs = (faqContent.faqs || []).map(faq => ({
        ...faq,
        answer: processAlignmentStyles(faq.answer)
      }));
      
      await updateContent("faqs", {
        title: faqContent.title,
        subTitle: faqContent.subTitle,
        description: faqContent.description,
        faqs: faqs,
      });
      success("FAQ updated successfully!");
      setIsEditingFAQ(false);
      setNewFAQ({ question: "", answer: "" });
      setEditingFAQIndex(null);
      loadContent();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update FAQ");
    } finally {
      setSavingContent(false);
    }
  };

  const addFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer) {
      error("Please fill in both question and answer");
      return;
    }
    
    if (!faqContent) return;
    
    const updatedFAQs = [...(faqContent.faqs || []), newFAQ];
    setFaqContent({ ...faqContent, faqs: updatedFAQs });
    setNewFAQ({ question: "", answer: "" });
  };

  const updateFAQItem = (index: number) => {
    if (!faqContent) return;
    
    const updatedFAQs = [...(faqContent.faqs || [])];
    updatedFAQs[index] = newFAQ;
    setFaqContent({ ...faqContent, faqs: updatedFAQs });
    setEditingFAQIndex(null);
    setNewFAQ({ question: "", answer: "" });
  };

  const deleteFAQ = (index: number) => {
    if (!faqContent) return;
    
    const updatedFAQs = faqContent.faqs?.filter((_, i) => i !== index) || [];
    setFaqContent({ ...faqContent, faqs: updatedFAQs });
  };

  const startEditFAQItem = (index: number) => {
    if (!faqContent?.faqs) return;
    setNewFAQ(faqContent.faqs[index]);
    setEditingFAQIndex(index);
  };

  const bannerSlots: { slot: BannerSlot; label: string; recommendedSize?: string }[] = [
    { slot: "hero-main", label: "Hero Main", recommendedSize: BANNER_SLOT_SIZES["hero-main"] },
    { slot: "hero-secondary", label: "Hero Secondary", recommendedSize: BANNER_SLOT_SIZES["hero-secondary"] },
    { slot: "hero-tertiary", label: "Hero Tertiary", recommendedSize: BANNER_SLOT_SIZES["hero-tertiary"] },
    { slot: "hero-last", label: "Hero Last (Above Feedback)", recommendedSize: BANNER_SLOT_SIZES["hero-last"] },
    { slot: "brand-promo-1", label: "Brand Promotional 1", recommendedSize: BANNER_SLOT_SIZES["brand-promo-1"] },
    { slot: "brand-promo-2", label: "Brand Promotional 2", recommendedSize: BANNER_SLOT_SIZES["brand-promo-2"] },
    { slot: "shop-main", label: "Shop Main", recommendedSize: BANNER_SLOT_SIZES["shop-main"] },
    { slot: "about-us", label: "About Us", recommendedSize: BANNER_SLOT_SIZES["about-us"] },
    { slot: "login", label: "Login / Sign up", recommendedSize: BANNER_SLOT_SIZES.login },
  ];

  const banner2Slots = Object.keys(BANNER2_SLOT_SIZES).map((slot) => ({
    slot: slot as Banner2Slot,
    label: slot.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    recommendedSize: BANNER2_SLOT_SIZES[slot],
  }));

  const loadBanners2 = async () => {
    setBanner2Loading(true);
    try {
      const data = await getBanners2();
      setBanners2(data);
      const slots = Object.keys(BANNER2_SLOT_SIZES);
      const initial: Record<string, BannerFormFields> = {};
      slots.forEach((slot) => {
        initial[slot] = { targetUrl: "", imageFile: null, imagePreview: null, clearImage: false };
      });
      data.forEach((b) => {
        if (b.slot in initial) {
          initial[b.slot] = {
            targetUrl: b.targetUrl || "",
            imageFile: null,
            imagePreview: b.imageUrl,
            clearImage: false,
          };
        }
      });
      setBanner2FormData(initial);
      setBanner2OriginalData(JSON.parse(JSON.stringify(initial)));
    } catch (err) {
      console.error("Failed to load Banner 2:", err);
      error("Failed to load second landing images");
    } finally {
      setBanner2Loading(false);
    }
  };

  const handleBanner2ImageSelect = (file: File, slot: Banner2Slot | string) => {
    setCurrentBanner2Slot(slot);
    setCurrentBanner2File(file);
    setShowBanner2Cropper(true);
  };

  const handleBanner2Crop = (croppedFile: File) => {
    if (!currentBanner2Slot) return;
    const preview = URL.createObjectURL(croppedFile);
    setBanner2FormData({
      ...banner2FormData,
      [currentBanner2Slot]: {
        ...banner2FormData[currentBanner2Slot],
        imageFile: croppedFile,
        imagePreview: preview,
        clearImage: false,
      },
    });
    setShowBanner2Cropper(false);
    setCurrentBanner2Slot(null);
    setCurrentBanner2File(null);
  };

  const startEditBanner2 = (slot: Banner2Slot | string) => {
    const banner = banners2.find((b) => b.slot === slot);
    setBanner2FormData({
      ...banner2FormData,
      [slot]: {
        targetUrl: banner?.targetUrl || "",
        imageFile: null,
        imagePreview: banner?.imageUrl || null,
        clearImage: false,
      },
    });
    setBanner2OriginalData({
      ...banner2OriginalData,
      [slot]: {
        targetUrl: banner?.targetUrl || "",
        imageFile: null,
        imagePreview: banner?.imageUrl || null,
        clearImage: false,
      },
    });
    setEditingBanner2Slot(slot);
  };

  const discardBanner2 = (slot: Banner2Slot | string) => {
    setBanner2FormData({
      ...banner2FormData,
      [slot]: { ...banner2OriginalData[slot] },
    });
    setEditingBanner2Slot(null);
  };

  const saveBanner2 = async (slot: Banner2Slot | string) => {
    try {
      await updateBanner2(slot, {
        targetUrl: banner2FormData[slot].targetUrl,
        file: banner2FormData[slot].imageFile,
        clearImage: banner2FormData[slot].clearImage === true,
      });
      removeCachedData(CACHE_KEYS.BANNERS2);
      success("Image updated successfully!");
      setEditingBanner2Slot(null);
      setBanner2FormData({
        ...banner2FormData,
        [slot]: { ...banner2FormData[slot], imageFile: null, clearImage: false },
      });
      loadBanners2();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update image");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not updated";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-4 items-center flex-wrap">
          <h1 className="text-2xl font-semibold theme-heading">
            {activeIsPolicy
              ? policyPages.find((p) => p.id === activeTab)?.label ||
                policyContent?.label ||
                policyContent?.title ||
                "Policy"
              : "Assets"}
          </h1>
          {!activeIsPolicy && (
            <FilterTabs
              tabs={[
                { id: "banners", label: "Banners" },
                { id: "banner2", label: "Banner 2" },
                { id: "faq", label: "FAQ" },
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          )}
        </div>
        {/* {activeIsPolicy && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddPolicy(true)}
            className="shrink-0"
          >
            + Add Policy
          </Button>
        )} */}
      </div>

      {/* Content */}

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          {bannerLoading ? (
            <p>Loading banners...</p>
          ) : (
            bannerSlots.map(({ slot, label, recommendedSize }) => {
              const banner = banners.find((b) => b.slot === slot);
              const isEditing = editingBannerSlot === slot;
              const formData = bannerFormData[slot];
              const imageUrl = formData.imagePreview || banner?.imageUrl;
              const aspect = getBannerAspect(slot);
              const isPromoMedia = isBrandPromoSlot(slot);
              const isVideoPreview = isVideoMediaUrl(imageUrl);

              return (
                <div key={slot} className="bg-white p-6 rounded-lg border border-gray-200 relative">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{label}</h3>
                      {recommendedSize && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          <strong>Recommended size:</strong> {recommendedSize}
                        </p>
                      )}
                    </div>
                    {!isEditing && (
                      <Button
                        onClick={() => startEditBanner(slot)}
                        className="theme-button text-white"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    <div className="space-y-4">
                      {imageUrl && (
                        <div>
                          <div
                            className="w-full max-w-xl overflow-hidden rounded border"
                            style={{ aspectRatio: aspect }}
                          >
                          {isVideoPreview ? (
                            <video src={imageUrl} className="w-full h-full object-cover" controls muted />
                          ) : banner?.targetUrl && !isPromoMedia ? (
                            <a
                              href={banner.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full h-full cursor-pointer"
                            >
                              <img
                                src={imageUrl}
                                alt={label}
                                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={label}
                              className="w-full h-full object-cover"
                            />
                          )}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>{isPromoMedia ? "YouTube URL:" : "Target URL:"}</strong> {banner?.targetUrl || "Not set"}
                        </p>
                      </div>
                      {banner?.updatedAt && (
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            Updated: {formatDate(banner.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <AssetMediaPickerField
                          label={isPromoMedia ? "Banner Media (image/video)" : "Banner Image"}
                          recommendedSize={BANNER_SLOT_SIZES[slot]}
                          preview={formData.imagePreview}
                          accept={isPromoMedia ? "image/*,video/*" : "image/*"}
                          previewAspectRatio={aspect}
                          previewIsVideo={isVideoMediaUrl(formData.imagePreview)}
                          onFileSelected={(file) => handleBannerImageSelect(file, slot)}
                          onClear={() => {
                            setBannerFormData({
                              ...bannerFormData,
                              [slot]: {
                                ...formData,
                                imagePreview: null,
                                imageFile: null,
                                clearImage: true,
                              },
                            });
                          }}
                        />
                        {banner?.imageUrl && !formData.imagePreview && (
                          <p className="text-sm text-gray-500 mt-2">
                            Current image will be kept if no new image is uploaded
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {isPromoMedia ? "YouTube URL (optional)" : "Target URL"}
                        </label>
                        <Input
                          value={formData.targetUrl}
                          onChange={(e) =>
                            setBannerFormData({
                              ...bannerFormData,
                              [slot]: {
                                ...formData,
                                targetUrl: e.target.value,
                              },
                            })
                          }
                          placeholder={isPromoMedia ? "https://www.youtube.com/watch?v=..." : "https://example.com"}
                          className="w-full"
                        />
                        {isPromoMedia && (
                          <p className="text-xs text-gray-500 mt-1">
                            You can add YouTube URL and/or upload video from PC.
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveBanner(slot)}
                          className="theme-button text-white"
                        >
                          Update
                        </Button>
                        <Button
                          onClick={() => discardBanner(slot)}
                          variant="outline"
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Banner 2 Tab – Second Landing page images */}
      {activeTab === "banner2" && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Manage images used on the <strong>Second Landing</strong> page. Recommended sizes are shown so you can upload the exact dimensions.
          </p>
          {banner2Loading ? (
            <p>Loading...</p>
          ) : (
            banner2Slots.map(({ slot, label, recommendedSize }) => {
              const banner = banners2.find((b) => b.slot === slot);
              const isEditing = editingBanner2Slot === slot;
              const formData = banner2FormData[slot] || {
                targetUrl: "",
                imageFile: null,
                imagePreview: null,
                clearImage: false,
              };
              const imageUrl = formData.imagePreview || banner?.imageUrl;
              const aspect = getBanner2Aspect(slot);

              return (
                <div key={slot} className="bg-white p-6 rounded-lg border border-gray-200 relative">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{label}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <strong>Recommended size:</strong> {recommendedSize}
                      </p>
                    </div>
                    {!isEditing && (
                      <Button
                        onClick={() => startEditBanner2(slot)}
                        className="theme-button text-white"
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-4">
                      {imageUrl && (
                        <div>
                          <div
                            className="w-full max-w-md overflow-hidden rounded border"
                            style={{ aspectRatio: aspect }}
                          >
                            {banner?.targetUrl ? (
                              <a
                                href={banner.targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full h-full cursor-pointer"
                              >
                                <img
                                  src={imageUrl}
                                  alt={label}
                                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                />
                              </a>
                            ) : (
                              <img
                                src={imageUrl}
                                alt={label}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Target URL:</strong> {banner?.targetUrl || "Not set"}
                        </p>
                      </div>
                      {banner?.updatedAt && (
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            Updated: {formatDate(banner.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AssetMediaPickerField
                        label="Image"
                        recommendedSize={recommendedSize}
                        preview={formData.imagePreview}
                        previewAspectRatio={aspect}
                        onFileSelected={(file) => handleBanner2ImageSelect(file, slot)}
                        onClear={() => {
                          setBanner2FormData((prev) => ({
                            ...prev,
                            [slot]: {
                              ...prev[slot],
                              imagePreview: null,
                              imageFile: null,
                              clearImage: true,
                            },
                          }));
                        }}
                      />
                      {banner?.imageUrl && !formData.imagePreview && (
                        <p className="text-sm text-gray-500 mt-2">
                          Current image will be kept if no new image is uploaded
                        </p>
                      )}

                      <div>
                        <label className="block text-sm font-medium mb-2">Target URL</label>
                        <Input
                          value={formData.targetUrl}
                          onChange={(e) =>
                            setBanner2FormData({
                              ...banner2FormData,
                              [slot]: { ...formData, targetUrl: e.target.value },
                            })
                          }
                          placeholder="https://example.com"
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveBanner2(slot)}
                          className="theme-button text-white"
                        >
                          Update
                        </Button>
                        <Button onClick={() => discardBanner2(slot)} variant="outline">
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeIsPolicy && (
        <ContentPageEditorPanel
          heading={
            policyPages.find((p) => p.id === activeTab)?.label ||
            policyContent?.label ||
            policyContent?.title ||
            "Policy"
          }
          content={policyContent}
          contentLoading={contentLoading}
          isEditing={isEditingPolicy}
          savingContent={savingContent}
          formatDate={formatDate}
          onStartEdit={startEditPolicy}
          onDiscard={discardPolicy}
          onUpdate={updatePolicy}
          onChange={setPolicyContent}
          processAlignmentStyles={processAlignmentStyles}
          showEnabledToggle
          onToggleEnabled={handleTogglePolicyEnabled}
          togglingEnabled={togglingEnabled}
          canDelete={canDeleteActivePolicy}
          onDelete={handleDeletePolicy}
          deleting={deletingPolicy}
          storePathHint={
            policyContent?.storePath ||
            policyPages.find((p) => p.id === activeTab)?.storePath
          }
        />
      )}

      {showAddPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold">Add Policy</h3>
            <p className="text-sm text-gray-600">
              Create a new policy page. It will appear in the Policies sidebar. Use the Enable switch to show or hide it on the storefront.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Policy name</label>
              <Input
                value={newPolicyLabel}
                onChange={(e) => setNewPolicyLabel(e.target.value)}
                placeholder="e.g. Warranty Policy"
                className="w-full"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddPolicy(false);
                  setNewPolicyLabel("");
                }}
                disabled={creatingPolicy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="theme-button text-white"
                onClick={handleCreatePolicy}
                disabled={creatingPolicy}
              >
                {creatingPolicy ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 relative">
          {contentLoading ? (
            <p>Loading...</p>
          ) : faqContent ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">FAQ</h2>
                {!isEditingFAQ && (
                  <Button
                    onClick={startEditFAQ}
                    className="theme-button text-white"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {!isEditingFAQ ? (
                <div className="space-y-4 pb-8">
                  <div>
                    <h3 className="font-semibold">{faqContent.title}</h3>
                    <p className="text-gray-600">{faqContent.subTitle}</p>
                  </div>

                  {/* FAQs List */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">FAQs ({faqContent.faqs?.length || 0})</h3>
                    <div className="space-y-4">
                      {faqContent.faqs && faqContent.faqs.length > 0 ? (
                        faqContent.faqs.map((faq, index) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-lg"
                          >
                            <h4 className="font-medium mb-2">{faq.question}</h4>
                            <div
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                              className="text-sm text-gray-600"
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No FAQs added yet.</p>
                      )}
                    </div>
                  </div>

                  {faqContent.lastUpdated && (
                    <div className="text-right absolute bottom-4 right-6">
                      <span className="text-sm text-gray-500">
                        Updated: {formatDate(faqContent.lastUpdated)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      value={faqContent.title}
                      onChange={(e) =>
                        setFaqContent({ ...faqContent, title: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Subtitle</label>
                    <Input
                      value={faqContent.subTitle}
                      onChange={(e) =>
                        setFaqContent({ ...faqContent, subTitle: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Add/Edit FAQ Form */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">
                      {editingFAQIndex !== null ? "Edit FAQ" : "Add New FAQ"}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Question</label>
                        <Input
                          value={newFAQ.question}
                          onChange={(e) =>
                            setNewFAQ({ ...newFAQ, question: e.target.value })
                          }
                          placeholder="Enter question"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Answer</label>
                        <RichTextEditor
                          value={newFAQ.answer}
                          onChange={(value) => {
                            // Process HTML to ensure alignment styles are preserved
                            const processedValue = processAlignmentStyles(value);
                            setNewFAQ({ ...newFAQ, answer: processedValue });
                          }}
                          className="w-full bg-white text-gray-900"
                          controls={[
                            ['bold', 'italic', 'underline', 'strike'],
                            ['h1', 'h2', 'h3'],
                            ['unorderedList', 'orderedList'],
                            ['link', 'image', 'video'],
                            ['alignLeft', 'alignCenter', 'alignRight'],
                            ['blockquote', 'code'],
                            ['sup', 'sub'],
                            ['clean'],
                          ]}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            editingFAQIndex !== null ? updateFAQItem(editingFAQIndex) : addFAQ()
                          }
                          className="theme-button text-white"
                        >
                          {editingFAQIndex !== null ? "Update FAQ" : "Add FAQ"}
                        </Button>
                        {editingFAQIndex !== null && (
                          <Button
                            onClick={() => {
                              setEditingFAQIndex(null);
                              setNewFAQ({ question: "", answer: "" });
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FAQs List */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">FAQs ({faqContent.faqs?.length || 0})</h3>
                    <div className="space-y-4">
                      {faqContent.faqs && faqContent.faqs.length > 0 ? (
                        faqContent.faqs.map((faq, index) => (
                          <div
                            key={index}
                            className="p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{faq.question}</h4>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => startEditFAQItem(index)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => deleteFAQ(index)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                              className="text-sm text-gray-600"
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No FAQs added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={updateFAQ}
                      className="theme-button text-white"
                      disabled={savingContent}
                    >
                      {savingContent ? "Updating..." : "Update"}
                    </Button>
                    <Button
                      onClick={discardFAQ}
                      variant="outline"
                      disabled={savingContent}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      )}

      {/* Image Cropper Modal (Banners) */}
      {showImageCropper && currentBannerSlot && currentImageFile && (
        <ImageCropperModal
          open={showImageCropper}
          onClose={() => {
            setShowImageCropper(false);
            setCurrentBannerSlot(null);
            setCurrentImageFile(null);
          }}
          file={currentImageFile}
          onCropDone={async (croppedBlob: Blob) => {
            const croppedFile = new File([croppedBlob], currentImageFile.name, { type: croppedBlob.type });
            handleImageCrop(croppedFile);
          }}
          aspect={currentBannerSlot ? getBannerAspect(currentBannerSlot) : 16 / 9}
        />
      )}

      {/* Image Cropper Modal (Banner 2) */}
      {showBanner2Cropper && currentBanner2Slot && currentBanner2File && (
        <ImageCropperModal
          open={showBanner2Cropper}
          onClose={() => {
            setShowBanner2Cropper(false);
            setCurrentBanner2Slot(null);
            setCurrentBanner2File(null);
          }}
          file={currentBanner2File}
          onCropDone={async (croppedBlob: Blob) => {
            const croppedFile = new File([croppedBlob], currentBanner2File.name, { type: croppedBlob.type });
            handleBanner2Crop(croppedFile);
          }}
          aspect={getBanner2Aspect(currentBanner2Slot)}
        />
      )}
    </div>
  );
}
