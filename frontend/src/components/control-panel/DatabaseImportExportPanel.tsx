import React, { useEffect, useRef, useState } from "react";
import { Database, Download, Upload, RefreshCw, AlertTriangle } from "lucide-react";
import {
  exportDatabaseBackup,
  getDatabaseStats,
  importDatabaseBackup,
  type DatabaseImportResult,
  type DatabaseStats,
} from "@/api/database.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";

type DbTab = "export" | "import";

export default function DatabaseImportExportPanel() {
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<DbTab>("export");
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [importResult, setImportResult] = useState<DatabaseImportResult | null>(null);
  const [confirmReplace, setConfirmReplace] = useState("");

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await getDatabaseStats();
      setStats(data);
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || "Failed to load database stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDatabaseBackup();
      success("Database exported as JSON");
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      error("Please choose a JSON backup file");
      return;
    }
    if (mode === "replace" && confirmReplace !== "REPLACE") {
      error('Type REPLACE to confirm destructive import');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const res = await importDatabaseBackup(file, mode);
      setImportResult(res.data);
      success(res.message);
      await loadStats();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              <Database className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Database</h1>
              <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                Export a full MongoDB JSON backup, or import one to merge / replace site data.
              </p>
              {stats && (
                <p className="mt-2 text-xs text-gray-500">
                  DB: <span className="font-medium text-gray-700">{stats.database}</span>
                  {" · "}
                  {stats.collections.length} collections · {stats.totalDocuments} documents
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={loadStats}
            disabled={loadingStats}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingStats ? <CircularLoader size={14} /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>

        <div className="mt-5 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {(
            [
              ["export", "Export"],
              ["import", "Import"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                tab === id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "export" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Export database</h2>
          <p className="text-sm text-gray-600">
            Downloads a JSON file with all application collections (products, orders, sections,
            users, etc.). Keep this file private — it may include passwords and customer data.
          </p>
          <button
            type="button"
            disabled={exporting}
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            {exporting ? <CircularLoader size={16} color="white" /> : <Download className="h-4 w-4" />}
            {exporting ? "Exporting…" : "Download JSON backup"}
          </button>

          {loadingStats ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <CircularLoader size={16} /> Loading collections…
            </div>
          ) : stats?.collections?.length ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Collection</th>
                    <th className="px-4 py-2.5 font-medium">Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.collections.map((c) => (
                    <tr key={c.name} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs text-gray-800">{c.name}</td>
                      <td className="px-4 py-2 text-gray-700">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {tab === "import" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Import database</h2>
          <p className="text-sm text-gray-600">
            Upload a previously exported JSON backup. Use <strong>Merge</strong> to upsert by{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">_id</code>, or{" "}
            <strong>Replace</strong> to wipe each collection then insert.
          </p>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              Import can overwrite live data. Prefer Merge for updates. Replace is destructive —
              export a backup first.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup file (.json)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setImportResult(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-200"
            />
            {file && (
              <p className="mt-1.5 text-xs text-gray-500">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Import mode</p>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="db-mode"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                />
                Merge (safe upsert)
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="db-mode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />
                Replace (wipe + insert)
              </label>
            </div>
          </div>

          {mode === "replace" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono">REPLACE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmReplace}
                onChange={(e) => setConfirmReplace(e.target.value)}
                placeholder="REPLACE"
                className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <button
            type="button"
            disabled={importing || !file}
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: mode === "replace" ? "#b91c1c" : "var(--theme-primary)" }}
          >
            {importing ? <CircularLoader size={16} color="white" /> : <Upload className="h-4 w-4" />}
            {importing ? "Importing…" : mode === "replace" ? "Replace database" : "Merge backup"}
          </button>

          {importResult && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Collection</th>
                    <th className="px-4 py-2.5 font-medium">Mode</th>
                    <th className="px-4 py-2.5 font-medium">Inserted</th>
                    <th className="px-4 py-2.5 font-medium">Upserted</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.results.map((r) => (
                    <tr key={r.name} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">{r.name}</td>
                      <td className="px-4 py-2">{r.mode}</td>
                      <td className="px-4 py-2">{r.inserted}</td>
                      <td className="px-4 py-2">{r.upserted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
