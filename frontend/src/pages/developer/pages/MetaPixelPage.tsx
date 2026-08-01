import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Edit, RotateCcw } from "lucide-react";
import { getCompany, updateCompany } from "@/api/company.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import { isValidMetaPixelId } from "@/utils/metaPixel";
import {
  META_PIXEL_EVENT_ROWS,
  defaultMetaPixelEvents,
  normalizeMetaPixelEvents,
  type MetaPixelEventKey,
  type MetaPixelEvents,
} from "@/utils/metaPixelEvents";

type MetaPixelSettings = {
  enabled: boolean;
  pixelId: string;
  events: MetaPixelEvents;
};

const DEFAULT: MetaPixelSettings = {
  enabled: false,
  pixelId: "",
  events: defaultMetaPixelEvents(true),
};

function normalize(raw?: Partial<MetaPixelSettings> | null): MetaPixelSettings {
  return {
    enabled: Boolean(raw?.enabled),
    pixelId: String(raw?.pixelId || "").replace(/\D/g, ""),
    events: normalizeMetaPixelEvents(raw?.events),
  };
}

export default function MetaPixelPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MetaPixelSettings>({ ...DEFAULT });
  const [original, setOriginal] = useState<MetaPixelSettings>({ ...DEFAULT });

  useEffect(() => {
    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached?.metaPixel) {
      const nav = normalize(cached.metaPixel);
      setSettings(nav);
      setOriginal(nav);
      setLoading(false);
    }
    void (async () => {
      try {
        const data = await getCompany();
        const nav = normalize(data?.metaPixel);
        setSettings(nav);
        setOriginal(nav);
        if (data) setCompanyCache(data);
      } catch {
        if (!cached) error("Failed to load Meta Pixel settings");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEvent = (key: MetaPixelEventKey, on: boolean) => {
    setSettings((prev) => ({
      ...prev,
      events: { ...prev.events, [key]: on },
    }));
  };

  const handleSave = async () => {
    const pixelId = settings.pixelId.trim();
    if (settings.enabled && !isValidMetaPixelId(pixelId)) {
      error("Enter a valid Meta Pixel ID before turning tracking on");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        enabled: settings.enabled,
        pixelId,
        events: settings.events,
      };
      const updated = await updateCompany({ metaPixel: payload });
      const next = normalize(updated?.metaPixel ?? payload);
      setSettings(next);
      setOriginal(next);
      if (updated) setCompanyCache(updated);
      success("Meta Pixel settings updated");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e instanceof Error ? e.message : null) ||
        "Failed to update Meta Pixel";
      error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = META_PIXEL_EVENT_ROWS.filter((r) => settings.events[r.key]).length;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 theme-text-primary" />
          <div>
            <h1 className="text-3xl font-bold theme-heading">Meta Pixel</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Facebook / Meta storefront tracking. Quick On/Off also on{" "}
              <Link to="/developer/control-panel" className="underline theme-text-primary">
                Control Panel
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettings(original)}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Tracking</h2>
            <p className="text-sm text-gray-500 mt-0.5">Master switch for the Meta Pixel script.</p>
          </div>
          <label className="inline-flex items-center gap-3 shrink-0 cursor-pointer select-none">
            <span className="text-sm text-gray-600">{settings.enabled ? "On" : "Off"}</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-[var(--theme-primary)]" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pixel ID</label>
          <input
            type="text"
            inputMode="numeric"
            value={settings.pixelId}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                pixelId: e.target.value.replace(/\D/g, ""),
              }))
            }
            placeholder="e.g. 123456789012345"
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            Meta Events Manager → Data sources → your Pixel → copy Pixel ID.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Event tracking</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {enabledCount} of {META_PIXEL_EVENT_ROWS.length} events enabled. Turn off any event to
              stop sending it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, events: defaultMetaPixelEvents(true) }))
              }
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, events: defaultMetaPixelEvents(false) }))
              }
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              Remove all
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium w-12">On</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Meta name</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">When it fires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {META_PIXEL_EVENT_ROWS.map((row) => {
                const on = settings.events[row.key] !== false;
                return (
                  <tr key={row.key} className="hover:bg-gray-50/80">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setEvent(row.key, e.target.checked)}
                        className="rounded border-gray-300 accent-[var(--theme-primary)]"
                        aria-label={`Toggle ${row.label}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {row.metaName}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{row.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
