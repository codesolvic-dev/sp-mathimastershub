import React, { useEffect, useRef, useState } from "react";
import { Bell, X, Wifi, WifiOff, ShoppingBag, Package, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications, OrderNotification } from "@/contexts/NotificationContext";
import { formatStoreMoney } from "@/utils/currency";
import { useTheme } from "@/contexts/ThemeContext";
import { getBrandThemeColors, hexToRgba } from "@/utils/brandTheme";
import { getOrderItemSummary } from "@/utils/orderNotification";
import { formatOrderNumber } from "@/utils/orderNumber";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useBrandColors() {
  const { theme } = useTheme();
  return getBrandThemeColors(theme);
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusColor(status: string, primary: string) {
  const s = status?.toLowerCase();
  if (s === "pending") return { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" };
  if (s === "completed" || s === "complete" || s === "delivered")
    return { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" };
  if (s === "cancelled" || s === "cancel")
    return { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" };
  return { bg: hexToRgba(primary, 0.12), text: primary, dot: primary };
}

// ─── Single notification card ─────────────────────────────────────────────────
function OrderCard({
  n,
  onRead,
}: {
  n: OrderNotification;
  onRead: (id: string) => void;
}) {
  const brand = useBrandColors();
  const [expanded, setExpanded] = useState(false);
  const sc = statusColor(n.status, brand.primary);
  const isUnread = !n.readAt;

  const { label: itemSummary } = getOrderItemSummary(n.items);
  const productImage = n.items?.find((it) => it.image)?.image;

  return (
    <div
      style={{
        background: isUnread ? hexToRgba(brand.primary, 0.06) : "#fff",
        border: `1px solid ${isUnread ? hexToRgba(brand.primary, 0.25) : "#F1F5F9"}`,
        borderRadius: 12,
        marginBottom: 8,
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header row */}
      <div
        onClick={() => {
          setExpanded((e) => !e);
          if (isUnread) onRead(n.id);
        }}
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        {/* Product image or fallback icon */}
        {productImage ? (
          <img
            src={productImage}
            alt={n.items?.[0]?.name || "Order item"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
              border: `1px solid ${hexToRgba(brand.primary, 0.2)}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${brand.primary}, ${brand.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 2px 8px ${hexToRgba(brand.primary, 0.3)}`,
            }}
          >
            <ShoppingBag size={16} color="#fff" />
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <span
              style={{
                fontWeight: isUnread ? 700 : 600,
                fontSize: 13,
                color: "#0F172A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {n.customerName}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {isUnread && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: brand.primary,
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ fontSize: 10, color: "#94A3B8" }}>{timeAgo(n.createdAt)}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>
              {formatStoreMoney(n.bill || 0)}
            </span>
            <span style={{ fontSize: 10, color: "#CBD5E1" }}>•</span>
            <span style={{ fontSize: 11, color: "#64748B" }}>{n.payment}</span>
            {itemSummary && (
              <>
                <span style={{ fontSize: 10, color: "#CBD5E1" }}>•</span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748B",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {itemSummary}
                </span>
              </>
            )}
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 5 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 600,
                background: sc.bg,
                color: sc.text,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: sc.dot,
                }}
              />
              {n.status}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            padding: "0 14px 14px 14px",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          {/* Order Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 10,
            }}
          >
            {[
              { label: "Order", value: formatOrderNumber(n.orderNumber, n._id) },
              { label: "Phone", value: n.phoneNumber || "—" },
              { label: "Type", value: n.type || "Online" },
              { label: "Payment", value: n.payment || "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "#F8FAFC",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: "#1E293B", fontWeight: 600, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Address */}
          {n.address && (
            <div
              style={{
                marginTop: 8,
                background: "#F8FAFC",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#94A3B8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Delivery Address
              </div>
              <div style={{ fontSize: 11, color: "#1E293B", lineHeight: 1.5 }}>
                {n.address.firstName} {n.address.lastName}
                <br />
                {n.address.area && `${n.address.area}, `}
                {n.address.city}, {n.address.province}
                {n.address.postalCode && ` – ${n.address.postalCode}`}
                <br />
                <span style={{ color: "#64748B", fontSize: 10 }}>
                  {n.address.line1?.length > 80
                    ? n.address.line1.slice(0, 80) + "…"
                    : n.address.line1}
                </span>
              </div>
            </div>
          )}

          {/* Items */}
          {n.items && n.items.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 9,
                  color: "#94A3B8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Items
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {n.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#F8FAFC",
                      borderRadius: 8,
                      padding: "5px 10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Package size={11} color={brand.primary} />
                      <span style={{ fontSize: 11, color: "#1E293B" }}>{item.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#64748B" }}>×{item.quantity}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
                        {formatStoreMoney((item.price || 0) * (item.quantity || 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupon */}
          {n.couponCode && (
            <div
              style={{
                marginTop: 8,
                background: hexToRgba(brand.primary, 0.05),
                border: `1px dashed ${hexToRgba(brand.primary, 0.3)}`,
                borderRadius: 8,
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: brand.primary }}>
                Coupon: {n.couponCode}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>
                -{formatStoreMoney(n.couponDiscount || 0)}
              </span>
            </div>
          )}

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              padding: "8px 10px",
              background: `linear-gradient(135deg, ${hexToRgba(brand.primary, 0.08)}, ${hexToRgba(brand.dark, 0.08)})`,
              borderRadius: 8,
              border: `1px solid ${hexToRgba(brand.primary, 0.15)}`,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: brand.primary }}>Total Bill</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>
              {formatStoreMoney(n.bill || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bell component ───────────────────────────────────────────────────────────
export default function NotificationBell() {
  const brand = useBrandColors();
  const { notifications, unreadCount, connected, markAllRead, markRead, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Calculate panel position relative to viewport so it never clips
  const openPanel = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      // Place panel below the bell, aligned to its left edge
      // Clamp so it doesn't overflow the right edge of the viewport
      const panelWidth = 370;
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 12) {
        left = window.innerWidth - panelWidth - 12;
      }
      setPanelPos({ top: rect.bottom + 8, left });
    }
    setOpen((o) => !o);
  };

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={openPanel}
        style={{
          position: "relative",
          width: 40,
          height: 40,
          borderRadius: 10,
          border: "none",
          background: open
            ? hexToRgba(brand.primary, 0.2)
            : "rgba(255,255,255,0.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s ease",
          color: "#fff",
        }}
        aria-label="Notifications"
        id="admin-notification-bell"
      >
        <Bell size={18} />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: "#EF4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              border: "2px solid #1e293b",
              animation: "pulse 1.5s infinite",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {/* Connection dot */}
        <span
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: connected ? "#10B981" : "#F59E0B",
            border: "2px solid #1e293b",
          }}
          title={connected ? "Live – connected to Pusher" : "Connecting…"}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            width: 370,
            maxHeight: 560,
            background: "#fff",
            borderRadius: 16,
            boxShadow:
              `0 20px 60px rgba(0,0,0,0.15), 0 4px 16px ${hexToRgba(brand.primary, 0.12)}`,
            border: `1px solid ${hexToRgba(brand.primary, 0.12)}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            animation: "slideDown 0.18s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px 12px",
              background: `linear-gradient(135deg, ${brand.primary}, ${brand.dark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingBag size={18} color="#fff" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                Order Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 20,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Connection status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
                {connected ? "Live" : "Connecting…"}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px",
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Action bar */}
          {notifications.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                borderBottom: "1px solid #F1F5F9",
                background: "#FAFBFF",
              }}
            >
              <span style={{ fontSize: 11, color: "#64748B" }}>
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: brand.primary,
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 0",
                    }}
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "#EF4444",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 0",
                  }}
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Notification list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px 10px",
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 20px",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: `linear-gradient(135deg, ${hexToRgba(brand.primary, 0.1)}, ${hexToRgba(brand.dark, 0.1)})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={24} color={brand.primary} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>
                    No notifications yet
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                    New orders will appear here instantly
                  </div>
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <OrderCard key={n.id} n={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid #F1F5F9",
              background: "#FAFBFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: connected ? "#10B981" : "#F59E0B",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, color: "#94A3B8" }}>
              {connected
                ? "Receiving live order updates via Pusher"
                : "Reconnecting to Pusher…"}
            </span>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}