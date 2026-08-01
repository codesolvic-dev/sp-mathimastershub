import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  X,
  GripVertical,
  MoreHorizontal,
  Code2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  getLandingSections,
  updateLandingSection,
  createLandingSection,
  duplicateLandingSection,
  type LandingSectionItem,
} from "@/api/landingsection.api";
import { getCachedData, removeCachedData, setCachedData } from "@/utils/cache";
import { getLandingCacheKeys } from "@/landings/shared/landingCache";
import { isCatalogStyleLandingSectionId } from "@/utils/landingSectionCatalog";
import {
  buildSectionContentMapFromList,
  getEditFieldDefsForSection,
  mergeContentForEditor,
  packContentForSave,
  resolveSectionTemplateId,
} from "@/utils/landingSectionContent";
import CircularLoader from "@/components/ui/CircularLoader";
import { useToast } from "@/components/ui/toast";
import {
  useProductDetailStyle,
  type ProductDetailStyleId,
} from "@/context/ProductDetailStyleContext";
import { getSpEcomSubPage, getEcomBuilderLandingPage } from "@/landings/tertiary/ecomSubPages";
import type { PreviewViewport } from "./SpEcomBuilderPreview";
import SpSectionEditor from "@/components/developer/SpSectionEditor";
import GridColumnPicker from "@/components/ui/GridColumnPicker";
import TextAlignPicker from "@/components/ui/TextAlignPicker";

const SpEcomBuilderPreview = React.lazy(() => import("./SpEcomBuilderPreview"));
const CategoryCheckboxPicker = React.lazy(
  () => import("@/components/admin/CategoryCheckboxPicker")
);
const ProductCheckboxPicker = React.lazy(
  () => import("@/components/admin/ProductCheckboxPicker")
);

import {
  SP_ECOM_ALWAYS_IN_BUILDER_IDS,
  SP_ECOM_SECTION_SUB_INFO,
} from "@/landings/tertiary/ecomSectionRegistry";
import {
  SP_ECOM_PRODUCT_ALWAYS_IN_BUILDER_IDS,
  SP_ECOM_PRODUCT_SECTION_SUB_INFO,
} from "@/landings/tertiary/ecomProductDetailSectionRegistry";
import {
  SP_ECOM_ABOUT_ALWAYS_IN_BUILDER_IDS,
  SP_ECOM_ABOUT_SECTION_SUB_INFO,
} from "@/landings/tertiary/ecomAboutSectionRegistry";

function buildEditingSectionsList(
  sorted: LandingSectionItem[],
  alwaysInBuilderIds: Set<string>
): EditingSection[] {
  if (!sorted.length) return [];
  const byOrder = [...sorted].sort((a, b) => a.order - b.order);
  const inRegistry = byOrder.filter((s) => {
    if (s.enabled) return true;
    if (alwaysInBuilderIds.has(s.sectionId)) return true;
    const base = String(s.baseSectionId || "").trim();
    return !!(base && alwaysInBuilderIds.has(base));
  });
  if (inRegistry.length > 0) return inRegistry;
  return byOrder.filter((s) => s.enabled);
}

interface EditingSection extends LandingSectionItem {
  // Local-only fields can be added here later (e.g., isNew, tempId)
}

export default function SpEcomBuilderPage() {
  const { slug = "home" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const subPage = getSpEcomSubPage(slug);
  const landingPage = getEcomBuilderLandingPage(slug);
  const landingCache = getLandingCacheKeys(landingPage);
  const alwaysInBuilderIds =
    landingPage === "tertiary-product"
      ? SP_ECOM_PRODUCT_ALWAYS_IN_BUILDER_IDS
      : landingPage === "tertiary-about"
        ? SP_ECOM_ABOUT_ALWAYS_IN_BUILDER_IDS
        : SP_ECOM_ALWAYS_IN_BUILDER_IDS;
  const sectionSubInfo =
    landingPage === "tertiary-product"
      ? SP_ECOM_PRODUCT_SECTION_SUB_INFO
      : landingPage === "tertiary-about"
        ? SP_ECOM_ABOUT_SECTION_SUB_INFO
        : SP_ECOM_SECTION_SUB_INFO;
  const isProductDetailBuilder = landingPage === "tertiary-product";
  const isAboutBuilder = landingPage === "tertiary-about";
  const previewVariant = isProductDetailBuilder
    ? "product-detail"
    : isAboutBuilder
      ? "about"
      : "home";
  const { success, error } = useToast();
  const {
    productDetailStyle,
    saveProductDetailStyle,
    saving: savingDetailStyle,
  } = useProductDetailStyle();

  const selectProductDetailStyle = async (style: ProductDetailStyleId) => {
    if (!isProductDetailBuilder) return;
    try {
      await saveProductDetailStyle(style);
      success(
        style === "2"
          ? "Product Detail Style 2 applied on product pages."
          : "Product Detail Style 1 applied on product pages."
      );
    } catch {
      error("Failed to save product detail style.");
    }
  };

  const [allSections, setAllSections] = useState<LandingSectionItem[]>(() => {
    const cached = getCachedData<LandingSectionItem[]>(landingCache.FULL);
    return Array.isArray(cached) ? [...cached].sort((a, b) => a.order - b.order) : [];
  });
  const [loading, setLoading] = useState(() => !getCachedData(landingCache.FULL));

  const [editingSections, setEditingSections] = useState<EditingSection[]>(() => {
    const cached = getCachedData<LandingSectionItem[]>(landingCache.FULL);
    if (!Array.isArray(cached) || !cached.length) return [];
    const sorted = [...cached].sort((a, b) => a.order - b.order);
    return buildEditingSectionsList(sorted, alwaysInBuilderIds);
  });
  const [originalEnabledIds, setOriginalEnabledIds] = useState<string[]>(() => {
    const cached = getCachedData<LandingSectionItem[]>(landingCache.FULL);
    if (!Array.isArray(cached)) return [];
    return cached.filter((s) => s.enabled).map((s) => s._id);
  });
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");

  // For drag-and-drop reordering inside the builder list
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("");
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const [editSection, setEditSection] = useState<LandingSectionItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editOriginalLabel, setEditOriginalLabel] = useState("");
  const [editOriginalCode, setEditOriginalCode] = useState("");
  const [editPreviewViewport, setEditPreviewViewport] = useState<PreviewViewport>("desktop");
  const [editContentFields, setEditContentFields] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const editTemplateId = editSection ? resolveSectionTemplateId(editSection) : "";

  const previewSectionContentMap = useMemo(() => {
    const map = buildSectionContentMapFromList(editingSections);
    if (editSection?.sectionId) {
      const merged = {
        ...(map[editSection.sectionId] ?? {}),
        ...editContentFields,
      };
      map[editSection.sectionId] = merged;
      const templateId = resolveSectionTemplateId(editSection);
      if (templateId && templateId !== editSection.sectionId) {
        map[templateId] = merged;
      }
    }
    return map;
  }, [editingSections, editSection, editContentFields]);

  useEffect(() => {
    const cached = getCachedData<LandingSectionItem[]>(landingCache.FULL);
    if (Array.isArray(cached) && cached.length > 0) {
      const sorted = [...cached].sort((a, b) => a.order - b.order);
      setAllSections(sorted);
      setOriginalEnabledIds(sorted.filter((s) => s.enabled).map((s) => s._id));
      setEditingSections(buildEditingSectionsList(sorted, alwaysInBuilderIds));
      setLoading(false);
      void loadSections({ silent: true });
    } else {
      setAllSections([]);
      setEditingSections([]);
      setOriginalEnabledIds([]);
      void loadSections({ silent: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landingPage]);

  const loadSections = async (options?: { silent?: boolean; keepEditingList?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const data = await getLandingSections(landingPage);
      const list = Array.isArray(data) ? data : [];
      setCachedData(landingCache.FULL, list);
      const sorted = [...list].sort((a, b) => a.order - b.order);
      setAllSections(sorted);

      const enabledIds = sorted.filter((s) => s.enabled).map((s) => s._id);
      setOriginalEnabledIds(enabledIds);

      if (options?.keepEditingList) {
        // Keep builder list (e.g. newly added opt-in sections) while refreshing server fields
        setEditingSections((prev) => {
          const byId = new Map(sorted.map((s) => [s._id, s]));
          return prev
            .filter((s) => byId.has(s._id))
            .map((s) => {
              const fresh = byId.get(s._id)!;
              return {
                ...fresh,
                enabled: s.enabled,
                contentJson: fresh.contentJson ?? s.contentJson,
              };
            });
        });
      } else {
        setEditingSections(buildEditingSectionsList(sorted, alwaysInBuilderIds));
      }
    } catch (err) {
      console.error("Failed to load landing sections for Sp - eCom:", err);
      error("Failed to load sections for Sp - eCom.");
      removeCachedData(landingCache.FULL);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  const handleDiscard = () => {
    setEditingSections(buildEditingSectionsList(allSections, alwaysInBuilderIds));
    setShowAddModal(false);
    setSelectedToAdd(new Set());
  };

  const handleBack = () => {
    navigate("/developer/sp-ecom");
  };

  const handleToggleEditingSection = (id: string) => {
    setEditingSections((prev) =>
      prev.map((sec) =>
        sec._id === id ? { ...sec, enabled: !sec.enabled } : sec
      )
    );
  };

  const handleToggleNavbarDropdown = async (section: LandingSectionItem, checked: boolean) => {
    try {
      const updated = await updateLandingSection(section._id, { showInNavbarDropdown: checked });
      removeCachedData(landingCache.ENABLED);
      removeCachedData(landingCache.SECTIONS);
      removeCachedData(landingCache.FULL);
      setEditingSections((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...s, ...updated, enabled: s.enabled } : s))
      );
      setAllSections((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...s, ...updated } : s)).sort((a, b) => a.order - b.order)
      );
      await loadSections({ silent: true });
      success(checked ? "Section will show in the navbar Other menu." : "Section hidden from the navbar Other menu.");
    } catch (err) {
      console.error("Failed to update navbar visibility:", err);
      error("Failed to update navbar visibility.");
    }
  };

  const handleRemoveFromList = (id: string) => {
    setEditingSections((prev) => prev.filter((sec) => sec._id !== id));
  };

  const handleOpenAddModal = () => {
    setSelectedToAdd(new Set());
    setShowAddModal(true);
    // Refresh available sections without wiping locally added builder rows
    void loadSections({ silent: true, keepEditingList: true });
  };

  const handleToggleSelectToAdd = (id: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmAdd = async () => {
    if (selectedToAdd.size === 0) {
      setShowAddModal(false);
      return;
    }

    const currentIds = new Set(editingSections.map((s) => s._id));
    const toAdd = allSections.filter(
      (s) => selectedToAdd.has(s._id) && !currentIds.has(s._id)
    );

    const nextEditing = [
      ...editingSections,
      ...toAdd.map((s) => ({ ...s, enabled: true })),
    ];

    setEditingSections(nextEditing);
    setAllSections((prev) =>
      prev.map((s) => (selectedToAdd.has(s._id) ? { ...s, enabled: true } : s))
    );
    setShowAddModal(false);
    setSelectedToAdd(new Set());

    // Persist enable so reload / Update / Edit-save cannot drop opt-in sections
    try {
      await Promise.all(
        toAdd
          .filter((s) => !s.enabled)
          .map((s) => updateLandingSection(s._id, { enabled: true }))
      );
      removeCachedData(landingCache.ENABLED);
      removeCachedData(landingCache.SECTIONS);
      removeCachedData(landingCache.FULL);
    } catch (err) {
      console.error("Failed to enable added sections:", err);
    }
  };

  const handleOpenCustomModal = () => {
    setCustomSectionName("");
    setShowCustomModal(true);
  };

  const handleOpenEditSection = (section: LandingSectionItem) => {
    if (isCatalogStyleLandingSectionId(section.sectionId)) return;
    const fresh = allSections.find((s) => s._id === section._id) ?? section;
    const code = typeof fresh.code === "string" ? fresh.code : "";
    const label = fresh.label ?? "";
    const templateId = resolveSectionTemplateId(fresh);
    setEditSection(fresh);
    setEditLabel(label);
    setEditCode(code);
    setEditOriginalLabel(label);
    setEditOriginalCode(code);
    setEditPreviewViewport("desktop");
    setEditContentFields(mergeContentForEditor(templateId, fresh.contentJson));
  };

  const handleCloseEditSection = () => {
    setEditSection(null);
    setEditLabel("");
    setEditCode("");
    setEditOriginalLabel("");
    setEditOriginalCode("");
    setEditContentFields({});
  };

  const handleDiscardEditSection = () => {
    setEditLabel(editOriginalLabel);
    setEditCode(editOriginalCode);
  };

  const handleSaveEditSection = async () => {
    if (!editSection || isSavingEdit) return;
    const name = editLabel.trim();
    if (!name) {
      error("Section name is required.");
      return;
    }
    setIsSavingEdit(true);
    try {
      const templateId = resolveSectionTemplateId(editSection);
      const defs = getEditFieldDefsForSection(templateId);
      const payload: {
        label: string;
        code: string;
        contentJson?: string;
      } = { label: name, code: editCode };
      if (defs.length > 0) {
        payload.contentJson = packContentForSave(templateId, editContentFields);
      }
      const updated = await updateLandingSection(editSection._id, payload);
      removeCachedData(landingCache.ENABLED);
      removeCachedData(landingCache.SECTIONS);
      removeCachedData(landingCache.FULL);
      setEditingSections((prev) =>
        prev.map((s) =>
          s._id === updated._id
            ? { ...updated, enabled: s.enabled, contentJson: updated.contentJson ?? payload.contentJson }
            : s
        )
      );
      setAllSections((prev) =>
        prev
          .map((s) =>
            s._id === updated._id
              ? { ...updated, enabled: s.enabled, contentJson: updated.contentJson ?? payload.contentJson }
              : s
          )
          .sort((a, b) => a.order - b.order)
      );
      // Keep builder list — full reload would drop opt-in sections not yet Update-enabled
      await loadSections({ silent: true, keepEditingList: true });
      success("Section updated.");
      handleCloseEditSection();
    } catch (err) {
      console.error("Failed to update section:", err);
      error("Failed to update section.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const handleDuplicateSection = async (section: LandingSectionItem) => {
    if (duplicatingId) return;
    setDuplicatingId(section._id);
    try {
      const created = await duplicateLandingSection(section._id);
      removeCachedData(landingCache.ENABLED);
      removeCachedData(landingCache.SECTIONS);
      removeCachedData(landingCache.FULL);
      await loadSections({ silent: true });
      setEditingSections((prev) => {
        const exists = prev.some((s) => s._id === created._id);
        if (exists) {
          return prev
            .map((s) => (s._id === created._id ? { ...created, enabled: true } : s))
            .sort((a, b) => a.order - b.order);
        }
        const idx = prev.findIndex((s) => s._id === section._id);
        const next = [...prev];
        const row = { ...created, enabled: true };
        if (idx >= 0) next.splice(idx + 1, 0, row);
        else next.push(row);
        return next;
      });
      success(`Duplicated “${created.label}”. Customize it independently.`);
    } catch (err: unknown) {
      console.error("Failed to duplicate section:", err);
      const apiMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string }; status?: number } })
              .response?.data?.message
          : undefined;
      error(apiMsg ? `Failed to duplicate section: ${apiMsg}` : "Failed to duplicate section.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleCreateCustomSection = async () => {
    const name = customSectionName.trim();
    if (!name || isCreatingCustom) return;
    setIsCreatingCustom(true);
    try {
      const newSection = await createLandingSection(name, landingPage);
      setAllSections((prev) => [...prev, newSection].sort((a, b) => a.order - b.order));
      setEditingSections((prev) =>
        [...prev, { ...newSection, enabled: true }].sort((a, b) => a.order - b.order)
      );
      success(`Custom section "${newSection.label}" created. Add your HTML below.`);
      setShowCustomModal(false);
      setShowAddModal(false);
      setCustomSectionName("");
      handleOpenEditSection(newSection);
    } catch (err) {
      console.error("Failed to create custom section:", err);
      error("Failed to create custom section.");
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const handleUpdate = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const enabledIds = new Set(
        editingSections.filter((s) => s.enabled).map((s) => s._id)
      );

      // Compute a new global order based on the current editing list order.
      // Sections in the editing list come first (in their visual order),
      // followed by any remaining sections.
      const editingIdSet = new Set(editingSections.map((s) => s._id));
      const orderedCombined: LandingSectionItem[] = [
        ...editingSections,
        ...allSections.filter((s) => !editingIdSet.has(s._id)),
      ];

      const newOrderMap: Record<string, number> = {};
      orderedCombined.forEach((section, index) => {
        newOrderMap[section._id] = index;
      });

      // Build list of updates only where enabled/order actually change
      const updates = allSections.map(async (section) => {
        const shouldBeEnabled = enabledIds.has(section._id);
        const newOrder = newOrderMap[section._id] ?? section.order;

        const payload: { enabled?: boolean; order?: number } = {};
        if (section.enabled !== shouldBeEnabled) {
          payload.enabled = shouldBeEnabled;
        }
        if (section.order !== newOrder) {
          payload.order = newOrder;
        }

        if (Object.keys(payload).length === 0) return;

        return updateLandingSection(section._id, payload);
      });

      await Promise.all(updates);

      removeCachedData(landingCache.ENABLED);
      removeCachedData(landingCache.SECTIONS);
      removeCachedData(landingCache.FULL);

      success("Sp - eCom updated. Sections on the site are refreshed.");

      // Refresh from server without full-page loader flash
      await loadSections({ silent: true });

      const newEnabledIds = Array.from(enabledIds);
      setOriginalEnabledIds(newEnabledIds);
    } catch (err) {
      console.error("Failed to update landing sections from Sp - eCom:", err);
      error("Failed to update Sp - eCom sections.");
    } finally {
      setIsSaving(false);
    }
  };

  const availableToAdd = allSections.filter(
    (s) => !editingSections.some((e) => e._id === s._id)
  );

  if (!subPage?.hasBuilder) {
    return (
      <div className="max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/developer/sp-ecom")}
          className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sp - eCom
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-bold theme-heading mb-2">{subPage?.title || "Page"}</h1>
          <p className="text-gray-600 text-sm">
            SpBuilder for this page is not available yet. Use Web Pages or Admin Assets to manage it.
          </p>
        </div>
      </div>
    );
  }

  const displayTitle = subPage?.title || "Home";

  if (editSection?.isCustom) {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <SpSectionEditor
          sectionLabel={editLabel}
          code={editCode}
          onCodeChange={setEditCode}
          onLabelChange={setEditLabel}
          viewport={editPreviewViewport}
          onViewportChange={setEditPreviewViewport}
          onSave={handleSaveEditSection}
          onBack={handleCloseEditSection}
          onDiscard={handleDiscardEditSection}
          isSaving={isSavingEdit}
          canSave={!!editLabel.trim()}
        />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: Section manager */}
        <div className="lg:w-[340px] xl:w-[380px] w-full shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white min-h-0 overflow-hidden">
          <div
            className="px-5 py-4 text-white shrink-0 flex items-center justify-between gap-3 min-h-[72px]"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            <div>
              <h1 className="text-lg font-bold">SpBuilder — {displayTitle}</h1>
              <p className="text-sm text-white/80 mt-0.5">Manage page sections</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors shrink-0"
              title="Add section"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {isProductDetailBuilder ? (
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0 space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Product page layout
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "1" as const,
                      title: "Style 1",
                      desc: "Current — theme title, tabs",
                    },
                    {
                      id: "2" as const,
                      title: "Style 2",
                      desc: "Buy It Now, accordion",
                    },
                  ] as const
                ).map((s) => {
                  const selected = productDetailStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={savingDetailStyle}
                      onClick={() => void selectProductDetailStyle(s.id)}
                      className={`text-left rounded-lg border-2 p-2.5 transition ${
                        selected
                          ? "border-[var(--theme-primary)] bg-white"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{s.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{s.desc}</p>
                        </div>
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selected
                              ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]"
                              : "border-gray-300"
                          }`}
                        >
                          {selected ? <Check className="w-2.5 h-2.5 text-white" /> : null}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100">
            {editingSections.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-500 text-sm">
                <p className="font-medium mb-1">No sections yet</p>
                <p>Tap + to add sections to this page.</p>
              </div>
            ) : (
              editingSections.map((section) => (
                <div
                  key={section._id}
                  className={`flex items-center gap-2 px-4 py-4 hover:bg-gray-50 transition-colors ${
                    draggingId === section._id ? "bg-gray-100 opacity-90" : ""
                  }`}
                  draggable
                  onDragStart={(e) => {
                    setDraggingId(section._id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", section._id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!draggingId || draggingId === section._id) return;
                    setEditingSections((prev) => {
                      const fromIndex = prev.findIndex((s) => s._id === draggingId);
                      const toIndex = prev.findIndex((s) => s._id === section._id);
                      if (fromIndex === -1 || toIndex === -1) return prev;
                      const updated = [...prev];
                      const [moved] = updated.splice(fromIndex, 1);
                      updated.splice(toIndex, 0, moved);
                      return updated;
                    });
                  }}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-grab shrink-0"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {section.label.replace(/ Banner$/, "")}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {sectionSubInfo[section.sectionId] ||
                        (section.baseSectionId
                          ? sectionSubInfo[section.baseSectionId]
                          : "") ||
                        section.label}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEditingSection(section._id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      section.enabled ? "" : "bg-gray-300"
                    }`}
                    style={
                      section.enabled ? { backgroundColor: "var(--theme-primary)" } : undefined
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        section.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full shrink-0"
                        title="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="bottom"
                      sideOffset={4}
                      className="bg-white border rounded-md shadow-md text-gray-900 min-w-[160px]"
                    >
                      {!isCatalogStyleLandingSectionId(section.sectionId) && (
                        <DropdownMenuItem
                          className="cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                          onClick={() => handleOpenEditSection(section)}
                        >
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="cursor-pointer text-gray-900 focus:bg-gray-50"
                        disabled={duplicatingId === section._id}
                        onClick={() => handleDuplicateSection(section)}
                      >
                        {duplicatingId === section._id ? "Duplicating…" : "Duplicate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-default focus:bg-gray-50"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center justify-between gap-4 w-full py-0.5">
                          <span className="text-sm text-gray-900">Show in navbar</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={section.showInNavbarDropdown !== false}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = !(section.showInNavbarDropdown !== false);
                              handleToggleNavbarDropdown(section, next);
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                              section.showInNavbarDropdown !== false ? "" : "bg-gray-300"
                            }`}
                            style={
                              section.showInNavbarDropdown !== false
                                ? { backgroundColor: "var(--theme-primary)" }
                                : undefined
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                section.showInNavbarDropdown !== false ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50"
                        onClick={() => handleRemoveFromList(section._id)}
                      >
                        Remove from page
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 shrink-0 space-y-2 bg-white">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isSaving}
              className="w-full py-2.5 text-sm font-medium text-white rounded-lg theme-button flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving && <CircularLoader size={14} color="white" />}
              Update
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                Discard
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="flex-1 min-h-[45vh] lg:min-h-0 flex flex-col bg-gray-100 overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-white shrink-0 min-h-[52px]"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            <span className="text-sm font-semibold shrink-0">Preview</span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-0.5 rounded-lg border border-white/25 p-0.5 bg-white/10 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewViewport("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition ${
                    previewViewport === "desktop"
                      ? "bg-white text-gray-900 font-medium"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport("tablet")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition ${
                    previewViewport === "tablet"
                      ? "bg-white text-gray-900 font-medium"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport("mobile")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition ${
                    previewViewport === "mobile"
                      ? "bg-white text-gray-900 font-medium"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile
                </button>
              </div>
              <Eye className="w-4 h-4 text-white/80" />
            </div>
          </div>
          <React.Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center min-h-[200px]">
                <CircularLoader />
              </div>
            }
          >
            <SpEcomBuilderPreview
              sections={editingSections}
              viewport={previewViewport}
              variant={previewVariant}
              sectionContentMap={previewSectionContentMap}
            />
          </React.Suspense>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Sections from Third Landing
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {availableToAdd.length === 0 ? (
              <p className="text-sm text-gray-500">
                All available sections are already in this Sp - eCom.
              </p>
            ) : (
              <div className="space-y-3">
                {availableToAdd.map((section) => {
                  const selected = selectedToAdd.has(section._id);
                  return (
                    <label
                      key={section._id}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/5"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex-1 mr-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {section.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {section.sectionId}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggleSelectToAdd(section._id)}
                        className="w-4 h-4 border-gray-300 rounded"
                        style={{ accentColor: "var(--theme-primary)" }}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-4 mt-6">
              <button
                type="button"
                onClick={handleOpenCustomModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Code2 className="w-4 h-4" />
                Custom
              </button>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdd}
                  className="px-4 py-2 text-sm text-white rounded-lg theme-button disabled:opacity-50"
                  disabled={availableToAdd.length === 0}
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit built-in section fields (custom sections use full SpEditor) */}
      {editSection && !editSection.isCustom && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit section</h3>
              <button
                type="button"
                onClick={handleCloseEditSection}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              <span className="font-medium text-gray-700">Section label</span> — used in the navbar{" "}
              <span className="font-medium">Other</span> menu (for sections not in the main links) and in builder lists.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section label</label>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent mb-4"
            />
            {getEditFieldDefsForSection(editTemplateId).map((field) => (
              <div key={field.key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.categoryChecklist ? (
                  <React.Suspense fallback={<CircularLoader />}>
                    <CategoryCheckboxPicker
                      value={editContentFields[field.key] ?? ""}
                      onChange={(val) =>
                        setEditContentFields((prev) => ({ ...prev, [field.key]: val }))
                      }
                      hint={field.categoryChecklistHint}
                    />
                  </React.Suspense>
                ) : field.productChecklist ? (
                  <React.Suspense fallback={<CircularLoader />}>
                    <ProductCheckboxPicker
                      value={editContentFields[field.key] ?? ""}
                      onChange={(val) =>
                        setEditContentFields((prev) => ({ ...prev, [field.key]: val }))
                      }
                      hint={field.productChecklistHint}
                      videosOnly={field.productChecklistVideosOnly !== false}
                    />
                  </React.Suspense>
                ) : field.gridColumns ? (
                  <GridColumnPicker
                    value={editContentFields[field.key] ?? "5"}
                    onChange={(val) =>
                      setEditContentFields((prev) => ({ ...prev, [field.key]: val }))
                    }
                  />
                ) : field.textAlign ? (
                  <TextAlignPicker
                    value={editContentFields[field.key] ?? "center"}
                    onChange={(val) =>
                      setEditContentFields((prev) => ({ ...prev, [field.key]: val }))
                    }
                  />
                ) : field.toggle ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <span className="text-sm text-gray-600">
                      {(editContentFields[field.key] ?? "yes") === "yes" ? "Visible on page" : "Hidden on page"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={(editContentFields[field.key] ?? "yes") === "yes"}
                      onClick={() =>
                        setEditContentFields((prev) => ({
                          ...prev,
                          [field.key]: (prev[field.key] ?? "yes") === "yes" ? "no" : "yes",
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                        (editContentFields[field.key] ?? "yes") === "yes" ? "" : "bg-gray-300"
                      }`}
                      style={
                        (editContentFields[field.key] ?? "yes") === "yes"
                          ? { backgroundColor: "var(--theme-primary)" }
                          : undefined
                      }
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-1 ${
                          (editContentFields[field.key] ?? "yes") === "yes"
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ) : field.selectOptions ? (
                  <select
                    value={editContentFields[field.key] ?? field.selectOptions[0]?.value ?? ""}
                    onChange={(e) =>
                      setEditContentFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                  >
                    {field.selectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.number ? (
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={editContentFields[field.key] ?? ""}
                    onChange={(e) =>
                      setEditContentFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                  />
                ) : field.multiline ? (
                  <textarea
                    value={editContentFields[field.key] ?? ""}
                    onChange={(e) =>
                      setEditContentFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    rows={
                      field.key === "bullets" || field.key === "features"
                        ? 5
                        : field.key === "logoSlides" || field.key === "statsLines"
                          ? 8
                          : 4
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-y min-h-[80px]"
                  />
                ) : (
                  <input
                    type="text"
                    value={editContentFields[field.key] ?? ""}
                    onChange={(e) =>
                      setEditContentFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                  />
                )}
              </div>
            ))}
            {getEditFieldDefsForSection(editTemplateId).length > 0 ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional: full HTML override
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  If filled, this replaces the entire section (the fields above are ignored until this is cleared).
                </p>
                <textarea
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  rows={6}
                  placeholder="Leave empty to use the fields above."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-y min-h-[80px]"
                />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML content</label>
                <textarea
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  rows={12}
                  placeholder="Your custom section HTML"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent resize-y min-h-[160px]"
                />
              </>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleCloseEditSection}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditSection}
                disabled={!editLabel.trim() || isSavingEdit}
                className="px-4 py-2 text-sm text-white rounded-lg theme-button disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingEdit && <CircularLoader size={14} color="white" />}
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Custom Section
              </h3>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomSectionName("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Enter a name for your custom section. You will open SpEditor next to add HTML.
            </p>
            <input
              type="text"
              value={customSectionName}
              onChange={(e) => setCustomSectionName(e.target.value)}
              placeholder="e.g. My Special Banner"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomSectionName("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomSection}
                disabled={!customSectionName.trim() || isCreatingCustom}
                className="px-4 py-2 text-sm text-white rounded-lg theme-button disabled:opacity-50 flex items-center gap-2"
              >
                {isCreatingCustom && <CircularLoader size={14} color="white" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

