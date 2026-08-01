import { useState } from "react";
import { Eye, Edit, GripVertical, Trash2 } from "lucide-react";
import type { Category } from "@/types/Category";
import StatusBadge from "@/components/ui/StatusBadge";

type DraggableCategoriesTableProps = {
  data: Category[];
  onReorder: (next: Category[]) => void;
  onView: (row: Category) => void;
  onEdit: (row: Category) => void;
  onDelete: (row: Category) => void;
  onStatusToggle: (row: Category) => void;
};

export default function DraggableCategoriesTable({
  data,
  onReorder,
  onView,
  onEdit,
  onDelete,
  onStatusToggle,
}: DraggableCategoriesTableProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reorderRows = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = data.findIndex((row) => row.id === fromId);
    const toIndex = data.findIndex((row) => row.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...data];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--theme-primary, #8B5E3C)" }}>
            <th className="w-10 px-3 py-3" aria-label="Drag to reorder" />
            <th className="px-3 py-3 text-left font-semibold text-white min-w-[60px]">ID</th>
            <th className="px-3 py-3 text-left font-semibold text-white min-w-[80px]">Icon</th>
            <th className="px-3 py-3 text-left font-semibold text-white min-w-[200px]">Category</th>
            <th className="px-3 py-3 text-left font-semibold text-white min-w-[100px]">Status</th>
            <th className="px-3 py-3 text-left font-semibold text-white min-w-[140px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const isDragging = draggingId === row.id;
            const isDragOver = dragOverId === row.id && draggingId !== row.id;

            return (
              <tr
                key={row.id}
                className={`category-draggable-row border-t border-gray-100 bg-white transition-colors ${
                  isDragging ? "opacity-50" : ""
                } ${isDragOver ? "bg-[var(--theme-light,#faf5f0)]" : "hover:bg-gray-50"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingId && draggingId !== row.id) {
                    setDragOverId(row.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverId === row.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId) reorderRows(draggingId, row.id);
                  setDraggingId(null);
                  setDragOverId(null);
                }}
              >
                <td className="px-3 py-3 align-middle">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(row.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", row.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                    aria-label={`Drag to reorder ${row.name}`}
                    title="Drag to arrange"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </td>
                <td className="px-3 py-3 text-gray-600 align-middle">{index + 1}</td>
                <td className="px-3 py-3 align-middle">
                  <img
                    src={row.icon && row.icon.trim() !== "" ? row.icon : "/category.png"}
                    alt={row.name}
                    className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== window.location.origin + "/category.png") {
                        target.src = "/category.png";
                      }
                    }}
                  />
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="py-1">
                    <div className="truncate font-medium text-gray-900" title={row.name}>
                      {row.name}
                    </div>
                    <div className="truncate text-sm text-gray-500">
                      {row.products || 0} products
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <button
                    type="button"
                    onClick={() => onStatusToggle(row)}
                    className="cursor-pointer"
                    title={`Click to mark as ${row.status === "active" ? "inactive" : "active"}`}
                  >
                    <StatusBadge status={row.status || "active"} type="product" />
                  </button>
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="enhanced-table-actions">
                    <div className="flex items-center gap-1 flex-nowrap">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center dots-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                          <circle cx="8" cy="4" r="1.5" fill="currentColor" />
                          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                          <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="action-buttons ml-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onView(row)}
                          className="p-1.5 text-gray-600 transition-colors hover:text-blue-600"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="p-1.5 text-gray-600 transition-colors hover:text-green-600"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="p-1.5 text-gray-600 transition-colors hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
