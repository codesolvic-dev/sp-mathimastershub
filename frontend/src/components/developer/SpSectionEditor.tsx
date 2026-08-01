import React, { useState, useRef, useEffect } from "react";
import { Monitor, Tablet, Smartphone, Play, Sparkles, Copy, Check } from "lucide-react";
import CircularLoader from "@/components/ui/CircularLoader";
import CustomSectionFrame from "@/components/developer/CustomSectionFrame";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SP_SECTION_AI_GUIDE_BLOCKS,
  SP_SECTION_AI_GUIDE_PROMPT,
  SP_SECTION_AI_GUIDE_TITLE,
} from "@/utils/spSectionAiGuide";

export type SpSectionEditorViewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<SpSectionEditorViewport, number> = {
  desktop: 0,
  tablet: 768,
  mobile: 375,
};

export interface SpSectionEditorProps {
  sectionLabel: string;
  code: string;
  onCodeChange: (code: string) => void;
  onLabelChange?: (label: string) => void;
  viewport: SpSectionEditorViewport;
  onViewportChange: (viewport: SpSectionEditorViewport) => void;
  onSave: () => void;
  onBack: () => void;
  onDiscard: () => void;
  isSaving?: boolean;
  canSave?: boolean;
}

export default function SpSectionEditor({
  sectionLabel,
  code,
  onCodeChange,
  onLabelChange,
  viewport,
  onViewportChange,
  onSave,
  onBack,
  onDiscard,
  isSaving = false,
  canSave = true,
}: SpSectionEditorProps) {
  const { success } = useToast();
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const previewHtml =
    code.trim() ||
    "<p style='color:#94a3b8;font-family:system-ui,sans-serif;padding:1rem'>Add HTML to see preview</p>";

  const handleCopyGuide = async () => {
    try {
      await navigator.clipboard.writeText(SP_SECTION_AI_GUIDE_PROMPT);
      setCopied(true);
      success("AI section prompt copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / denied clipboard
      const ta = document.createElement("textarea");
      ta.value = SP_SECTION_AI_GUIDE_PROMPT;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        success("AI section prompt copied!");
        window.setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleGuideButtonClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setCopied(false);
      setGuideOpen(true);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleCopyGuide();
      }, 250);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: SpEditor */}
        <div className="lg:w-[42%] xl:w-[38%] w-full min-h-[40%] lg:min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white min-h-0">
          <div
            className="px-5 py-4 text-white shrink-0 flex items-center justify-between gap-3"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            <div>
              <h2 className="text-lg font-bold leading-tight">SpEditor — Section</h2>
              <p className="text-sm text-white/80 mt-0.5">Edit section code</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleGuideButtonClick}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors relative"
                title={copied ? "Copied to clipboard!" : "Single click: Copy Prompt | Double click: Open Guide"}
                aria-label="AI section guide"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-300" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setPreviewReloadKey((k) => k + 1)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                title="Reload preview (run animations & scripts)"
                aria-label="Reload preview"
              >
                <Play className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {onLabelChange && (
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">Section name</label>
              <input
                type="text"
                value={sectionLabel}
                onChange={(e) => onLabelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              />
            </div>
          )}

          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="<section>...</section>"
            spellCheck={false}
            className="flex-1 w-full min-h-0 p-4 text-sm font-mono border-0 focus:outline-none focus:ring-0 resize-none leading-relaxed"
          />

          <div className="p-4 border-t border-gray-200 shrink-0 space-y-2 bg-white">
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave || isSaving}
              className="w-full py-2.5 text-sm font-medium text-white rounded-lg theme-button flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving && <CircularLoader size={14} color="white" />}
              Update
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
              >
                Discard
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 min-h-0 flex flex-col bg-gray-100 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
            <span className="text-sm font-semibold text-gray-800">Preview</span>
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => onViewportChange("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
                  viewport === "desktop"
                    ? "bg-white shadow text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => onViewportChange("tablet")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
                  viewport === "tablet"
                    ? "bg-white shadow text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Tablet className="w-4 h-4" />
                Tablet
              </button>
              <button
                type="button"
                onClick={() => onViewportChange("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition ${
                  viewport === "mobile"
                    ? "bg-white shadow text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-4 flex justify-center">
            <div
              className="h-full min-h-[360px] bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm transition-all duration-200"
              style={{
                width: VIEWPORT_WIDTHS[viewport] === 0 ? "100%" : `${VIEWPORT_WIDTHS[viewport]}px`,
                maxWidth: "100%",
              }}
            >
              <CustomSectionFrame
                html={previewHtml}
                title={`Preview: ${sectionLabel}`}
                reloadKey={previewReloadKey}
                className="min-h-[360px]"
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="!flex flex-col max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-white text-gray-900 border border-gray-200 shadow-xl">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-4 pr-12 border-b border-gray-200 bg-white">
            <DialogTitle className="flex items-center gap-2 text-gray-900 text-xl font-bold">
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: "var(--theme-primary)" }} />
              {SP_SECTION_AI_GUIDE_TITLE}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm leading-relaxed">
              Follow these SP standards to create sections. Copy Guide pastes the full AI prompt to
              your clipboard.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            {/* Live font samples */}
            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Font style preview
              </p>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Heading — 16px / weight 800
                </p>
                <p
                  className="leading-snug"
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--theme-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  Sample section heading
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Body — 12px / weight 400
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "#4b5563",
                    lineHeight: 1.5,
                  }}
                >
                  Sample body text. Keep supporting copy at 12px so it matches storefront density.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Button — 16px white on primary
                </p>
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-white"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    backgroundColor: "var(--theme-primary)",
                  }}
                >
                  Shop now
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {SP_SECTION_AI_GUIDE_BLOCKS.map((block) => (
                <div
                  key={block.label}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <div
                    className="px-3 py-2 text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--theme-primary)" }}
                  >
                    {block.label}
                  </div>
                  <dl className="divide-y divide-gray-100">
                    {block.rows.map((row) => (
                      <div
                        key={row.name}
                        className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-3 px-3 py-2.5"
                      >
                        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:normal-case sm:text-sm sm:tracking-normal">
                          {row.name}
                        </dt>
                        <dd className="text-sm text-gray-900 font-medium leading-relaxed break-words">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10">
                <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                  Full AI prompt (copied by Copy Guide)
                </p>
              </div>
              <pre className="px-3 py-3 text-[11px] sm:text-xs leading-relaxed text-emerald-100 whitespace-pre-wrap font-mono">
                {SP_SECTION_AI_GUIDE_PROMPT}
              </pre>
            </div>
          </div>

          <DialogFooter className="shrink-0 sm:justify-between gap-2 px-6 py-4 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopyGuide}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Guide"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
