import React, { useRef, useState } from "react";
import { Download, FileUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadProductImportTemplate,
  exportProductsCsv,
  importProductsCsv,
  type ProductImportResult,
} from "@/api/product.api";
import { useToast } from "@/components/ui/toast";

type Props = {
  onImported?: () => void | Promise<void>;
};

export default function ProductImportExportActions({ onImported }: Props) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProductImportResult | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProductsCsv();
      success("Products exported as CSV");
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadProductImportTemplate();
      success("Import template downloaded");
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || "Template download failed");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const openImport = () => {
    setSelectedFile(null);
    setResult(null);
    setImportOpen(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runImport = async () => {
    if (!selectedFile) {
      error("Please choose a CSV file");
      return;
    }
    setImporting(true);
    try {
      const data = await importProductsCsv(selectedFile);
      setResult(data);
      success(data.message || "Products imported");
      await onImported?.();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-gray-300 text-gray-800"
          onClick={handleExport}
          disabled={exporting}
        >
          <Download className="w-4 h-4 mr-1.5" />
          {exporting ? "Exporting…" : "Export"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-gray-300 text-gray-800"
          onClick={openImport}
        >
          <Upload className="w-4 h-4 mr-1.5" />
          Import
        </Button>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Import products</DialogTitle>
            <DialogDescription>
              Upload a CSV file. Matching products update by{" "}
              <strong>ID</strong> or <strong>SKU</strong>; new rows are created.
              After editing in Excel, use{" "}
              <strong>Save As → CSV UTF-8</strong> (not .xlsx). Keep a{" "}
              <strong>Title</strong> or <strong>Name</strong> column header.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onFileChange}
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="w-4 h-4 mr-1.5" />
                  Choose CSV
                </Button>
                <p className="text-sm text-gray-600 truncate">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTemplate}
              disabled={downloadingTemplate}
              className="text-sm font-medium underline"
              style={{ color: "var(--theme-primary)" }}
            >
              {downloadingTemplate ? "Downloading template…" : "Download CSV template"}
            </button>

            {result && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-2">
                <p className="font-medium text-gray-900">{result.message}</p>
                <div className="flex flex-wrap gap-3 text-gray-600">
                  <span>Created: {result.created}</span>
                  <span>Updated: {result.updated}</span>
                  <span>Skipped: {result.skipped}</span>
                  <span>Rows: {result.totalRows}</span>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                    {result.errors.slice(0, 20).map((errItem, idx) => (
                      <p key={`${errItem.row}-${idx}`} className="text-xs text-amber-700">
                        Row {errItem.row}: {errItem.message}
                      </p>
                    ))}
                    {result.errors.length > 20 && (
                      <p className="text-xs text-gray-500">
                        +{result.errors.length - 20} more messages
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-gray-300"
              onClick={() => setImportOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              className="text-white theme-button"
              onClick={runImport}
              disabled={!selectedFile || importing}
            >
              {importing ? "Importing…" : "Upload and import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
