import React, { useState, useCallback, useEffect } from "react";
import EnhancedDataTable from "../../../pages/admin/components/table/EnhancedDataTable";
import { DataTableSkeleton } from "@/components/ui/TableSkeleton";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import QueryModal from "@/components/admin/queries/QueryModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteQuery, getQueries, getQuerySourceLabel, type SupportQuery } from "@/api/query.api";
import { useToast } from "@/components/ui/toast";

interface QueryRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  raw: SupportQuery;
}

function mapDocToQuery(doc: SupportQuery): QueryRow {
  const rawDesc = String(doc.description ?? "");
  let name = String(doc.name || "").trim();
  if (!name) {
    const nameLine = rawDesc.match(/^Name:\s*(.+?)(?:\r?\n|$)/);
    if (nameLine) name = nameLine[1].trim();
  }
  const messageBody = rawDesc.replace(/^Name:\s*.+?\r?\n\r?\n?/, "").trim() || rawDesc;
  const id = String(doc._id || doc.id || "");

  return {
    id,
    name: name || "—",
    email: String(doc.email ?? ""),
    subject: String(doc.subject ?? ""),
    message: messageBody || String(doc.subject ?? ""),
    source: getQuerySourceLabel(doc.source),
    status: String(doc.status ?? "Pending"),
    adminReply: doc.adminReply,
    createdAt: doc.createdAt || new Date().toISOString(),
    raw: doc,
  };
}

export default function QueriesTable() {
  const { success, error: showError } = useToast();
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState<"All" | "read" | "pending" | "replied">("All");
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<QueryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadQueries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getQueries();
      const list = Array.isArray(data) ? data : [];
      setQueries(list.map((row) => mapDocToQuery(row)));
    } catch (e: unknown) {
      setQueries([]);
      const err = e as Error & { response?: { data?: { message?: string } } };
      const silent = err?.name === "SilentError" || String(err?.message || "").includes("Unauthorized");
      if (silent) {
        showError("Could not load queries. Please sign in again as admin.");
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to load queries.";
        showError(String(msg));
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    let data = [...queries];

    if (selectedTab !== "All") {
      data = data.filter((query) => query.status.toLowerCase() === selectedTab.toLowerCase());
    }

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (query) =>
          query.name.toLowerCase().includes(s) ||
          query.email.toLowerCase().includes(s) ||
          query.subject.toLowerCase().includes(s) ||
          query.message.toLowerCase().includes(s) ||
          query.source.toLowerCase().includes(s)
      );
    }

    setFilteredQueries(data);
  }, [queries, selectedTab, search]);

  const openQuery = (row: QueryRow) => {
    setSelectedQuery(row.raw);
    setModalOpen(true);
  };

  const handleDeleteClick = (row: QueryRow) => {
    setDeleteConfirm(row);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?.id) return;
    setDeleting(true);
    try {
      await deleteQuery(deleteConfirm.id);
      success("Query deleted successfully.");
      setDeleteConfirm(null);
      if (selectedQuery && String(selectedQuery._id || selectedQuery.id) === deleteConfirm.id) {
        setModalOpen(false);
        setSelectedQuery(null);
      }
      await loadQueries();
    } catch (e: unknown) {
      const err = e as Error & { response?: { data?: { message?: string } } };
      showError(err.response?.data?.message || err.message || "Failed to delete query.");
    } finally {
      setDeleting(false);
    }
  };

  const getColumns = () => {
    return [
      {
        name: "SR",
        cell: (_row: QueryRow, index: number) => <span className="text-gray-600">{index + 1}</span>,
        minWidth: "60px",
      },
      {
        name: "Customer",
        heading: (row: QueryRow) => row.name,
        subInfo: (row: QueryRow) => row.email,
        minWidth: "200px",
      },
      {
        name: "Subject",
        heading: (row: QueryRow) => row.subject,
        subInfo: (row: QueryRow) => row.source,
        minWidth: "180px",
      },
      {
        name: "Message",
        cell: (row: QueryRow) => (
          <button type="button" onClick={() => openQuery(row)} className="text-left py-1 w-full">
            <div className="text-sm text-gray-900 line-clamp-2 hover:underline" title={row.message}>
              {row.message.length > 50 ? row.message.substring(0, 50) + "...." : row.message}
            </div>
          </button>
        ),
        minWidth: "260px",
      },
      {
        name: "Status",
        cell: (row: QueryRow) => <StatusBadge status={row.status} type="query" />,
        minWidth: "100px",
      },
      {
        name: "Created At",
        cell: (row: QueryRow) => new Date(row.createdAt).toLocaleDateString(),
        minWidth: "120px",
      },
    ];
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Query"
        message={`Are you sure you want to delete this query from ${deleteConfirm?.name || deleteConfirm?.email || "customer"}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteConfirm(null)}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />

      <QueryModal
        query={selectedQuery}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={loadQueries}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
        <div className="flex gap-4 items-center flex-wrap">
          <h2 className="text-2xl font-semibold theme-heading">Queries</h2>
          <FilterTabs
            tabs={[
              { id: "All", label: "All" },
              { id: "read", label: "Read" },
              { id: "pending", label: "Pending" },
              { id: "replied", label: "Replied" },
            ]}
            activeTab={selectedTab}
            onTabChange={(tabId) => setSelectedTab(tabId as any)}
          />
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-0">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 text-gray-900"
            style={{ borderColor: "var(--theme-primary)" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-primary)";
              e.currentTarget.style.boxShadow = "";
            }}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4">
            <DataTableSkeleton rows={8} />
          </div>
        ) : (
          <EnhancedDataTable<QueryRow>
            columns={getColumns()}
            data={filteredQueries}
            onView={openQuery}
            onDelete={handleDeleteClick}
            pagination
          />
        )}
      </div>
    </div>
  );
}
