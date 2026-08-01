import React, { useEffect, useState } from "react";
import { Edit, RotateCcw, Search } from "lucide-react";
import { getCompany, updateCompany } from "@/api/company.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import {
  applyGoogleSiteVerification,
  googleSiteVerificationMetaSnippet,
  parseGoogleSiteVerificationInput,
} from "@/utils/googleSiteVerification";

export default function GoogleSearchConsolePage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gscInput, setGscInput] = useState("");
  const [gscOriginal, setGscOriginal] = useState("");

  useEffect(() => {
    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached?.googleSiteVerification !== undefined) {
      const token = parseGoogleSiteVerificationInput(cached.googleSiteVerification);
      const display = token ? googleSiteVerificationMetaSnippet(token) : "";
      setGscInput(display);
      setGscOriginal(display);
      setLoading(false);
    }

    void (async () => {
      try {
        const data = await getCompany();
        const token = parseGoogleSiteVerificationInput(data?.googleSiteVerification);
        const display = token ? googleSiteVerificationMetaSnippet(token) : "";
        setGscInput(display);
        setGscOriginal(display);
        applyGoogleSiteVerification(token);
        if (data) setCompanyCache(data);
      } catch {
        if (!cached) error("Failed to load Google Search Console settings");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const token = parseGoogleSiteVerificationInput(gscInput);
    if (gscInput.trim() && !token) {
      error("Could not read a verification content value from that input. Paste the full meta tag or the content token only.");
      return;
    }
    try {
      setSaving(true);
      const updated = await updateCompany({ googleSiteVerification: token });
      const fromServer = parseGoogleSiteVerificationInput(updated?.googleSiteVerification);
      // Don't wipe the field if server returned empty after we sent a token (schema/cache edge case)
      const saved = token ? fromServer || token : "";
      // Keep showing the full meta snippet so it doesn't look like the tag was deleted
      const display = saved ? googleSiteVerificationMetaSnippet(saved) : "";
      setGscInput(display);
      setGscOriginal(display);
      applyGoogleSiteVerification(saved);
      setCompanyCache({
        ...(updated || {}),
        googleSiteVerification: saved,
      });
      success(saved ? "Google verification meta saved" : "Google verification meta cleared");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e instanceof Error ? e.message : null) ||
        "Failed to update Google Search Console";
      error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const previewSnippet = googleSiteVerificationMetaSnippet(gscInput);

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-7 h-7 theme-text-primary" />
          <div>
            <h1 className="text-3xl font-bold theme-heading">Google Search Console</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              HTML tag ownership verification — injects{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">google-site-verification</code> into
              the site &lt;head&gt;.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGscInput(gscOriginal)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Discard
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white theme-button"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            {saving ? <CircularLoader size={16} color="white" /> : <Edit size={16} />}
            Update
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification meta tag or content
            </label>
            <textarea
              value={gscInput}
              onChange={(e) => setGscInput(e.target.value)}
              rows={4}
              placeholder={`Paste either:\n<meta name="google-site-verification" content="ABC123XYZ456..." />\nor just: ABC123XYZ456...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Google Search Console → Add property → HTML tag → copy the meta tag (or only the{" "}
              <code className="bg-gray-100 px-1 rounded">content</code> value). Clear the field and
              Update to remove it.
            </p>
          </div>

          {previewSnippet ? (
            <div className="rounded-lg border border-gray-200 bg-slate-900 p-3">
              <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2">
                Will inject
              </p>
              <code className="text-xs text-emerald-100 break-all">{previewSnippet}</code>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
