import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@mantine/rte";
import type { ComponentProps } from "react";
import type { ContentPage } from "@/api/content.api";

type RichTextControls = NonNullable<ComponentProps<typeof RichTextEditor>["controls"]>;

const RICH_TEXT_CONTROLS: RichTextControls = [
  ["bold", "italic", "underline", "strike"],
  ["h1", "h2", "h3"],
  ["unorderedList", "orderedList"],
  ["link", "image", "video"],
  ["alignLeft", "alignCenter", "alignRight"],
  ["blockquote", "code"],
  ["sup", "sub"],
  ["clean"],
];

type ContentPageEditorPanelProps = {
  heading: string;
  content: ContentPage | null;
  contentLoading: boolean;
  isEditing: boolean;
  savingContent: boolean;
  formatDate: (dateString?: string) => string;
  onStartEdit: () => void;
  onDiscard: () => void;
  onUpdate: () => void;
  onChange: (content: ContentPage) => void;
  processAlignmentStyles: (html: string) => string;
  /** Show enable toggle (policies). When disabled, page is hidden on storefront. */
  showEnabledToggle?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  togglingEnabled?: boolean;
  storePathHint?: string;
  canDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
};

export default function ContentPageEditorPanel({
  heading,
  content,
  contentLoading,
  isEditing,
  savingContent,
  formatDate,
  onStartEdit,
  onDiscard,
  onUpdate,
  onChange,
  processAlignmentStyles,
  showEnabledToggle = false,
  onToggleEnabled,
  togglingEnabled = false,
  storePathHint,
  canDelete = false,
  onDelete,
  deleting = false,
}: ContentPageEditorPanelProps) {
  const enabled = content?.enabled !== false;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 relative">
      {contentLoading ? (
        <p>Loading...</p>
      ) : content ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold">{heading}</h2>
              {storePathHint && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Store URL: <span className="font-mono">{storePathHint}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {showEnabledToggle && onToggleEnabled && (
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-sm text-gray-700">
                    {enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={togglingEnabled || deleting}
                    onClick={() => onToggleEnabled(!enabled)}
                    className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: enabled ? "var(--theme-primary)" : "#D1D5DB",
                    }}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                        enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              )}
              {canDelete && onDelete && !isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDelete}
                  disabled={deleting}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              {!isEditing && (
                <Button onClick={onStartEdit} className="theme-button text-white" disabled={deleting}>
                  Edit
                </Button>
              )}
            </div>
          </div>

          {showEnabledToggle && !enabled && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This policy is disabled and will not appear on the storefront or in the footer.
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-4 pb-8">
              <div>
                <h3 className="font-semibold">{content.title}</h3>
                <p className="text-gray-600">{content.subTitle}</p>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: content.description }}
                className="prose max-w-none content-area"
              />
              {content.lastUpdated && (
                <div className="text-right absolute bottom-4 right-6">
                  <span className="text-sm text-gray-500">
                    Updated: {formatDate(content.lastUpdated)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={content.title}
                  onChange={(e) => onChange({ ...content, title: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <Input
                  value={content.subTitle}
                  onChange={(e) => onChange({ ...content, subTitle: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <RichTextEditor
                  value={content.description}
                  onChange={(value) => {
                    onChange({ ...content, description: processAlignmentStyles(value) });
                  }}
                  className="w-full bg-white text-gray-900"
                  controls={RICH_TEXT_CONTROLS}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={onUpdate}
                  className="theme-button text-white"
                  disabled={savingContent}
                >
                  {savingContent ? "Updating..." : "Update"}
                </Button>
                <Button onClick={onDiscard} variant="outline" disabled={savingContent}>
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
  );
}
