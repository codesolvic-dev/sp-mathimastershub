import API from "./axios";

export type DatabaseCollectionStat = { name: string; count: number };

export type DatabaseStats = {
  database: string;
  collections: DatabaseCollectionStat[];
  totalDocuments: number;
};

export type DatabaseImportResult = {
  mode: "merge" | "replace";
  results: { name: string; mode: string; inserted: number; upserted: number }[];
};

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const res = await API.get("/database/stats");
  return res.data.data as DatabaseStats;
}

export async function exportDatabaseBackup(): Promise<void> {
  const res = await API.get("/database/export", {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/json" });
  const disposition = String(res.headers["content-disposition"] || "");
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename =
    match?.[1] ||
    `sp-builder-db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importDatabaseBackup(
  file: File,
  mode: "merge" | "replace"
): Promise<{ message: string; data: DatabaseImportResult }> {
  const form = new FormData();
  form.append("file", file);
  form.append("mode", mode);
  const res = await API.post("/database/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 10 * 60 * 1000,
  });
  return {
    message: res.data.message || "Import complete",
    data: res.data.data as DatabaseImportResult,
  };
}
