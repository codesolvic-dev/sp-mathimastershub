import type { OrderItem } from "@/contexts/NotificationContext";

export function getOrderItemCount(items?: OrderItem[]): number {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
}

/** 1 item → "1 item Product Name"; 2+ items → "N items" */
export function getOrderItemSummary(items?: OrderItem[]): { count: number; label: string } {
  if (!items?.length) return { count: 0, label: "" };

  const count = getOrderItemCount(items);
  if (count === 1) {
    const name = items[0]?.name || "";
    return { count: 1, label: name ? `1 item ${name}` : "1 item" };
  }
  return { count, label: `${count} items` };
}
