import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { getPusher, disconnectPusher } from "@/lib/pusher";
import { formatStoreMoney } from "@/utils/currency";
import { useTheme } from "@/contexts/ThemeContext";
import { getBrandThemeColors, hexToRgba } from "@/utils/brandTheme";
import { playOrderNotificationSound, unlockNotificationAudio } from "@/utils/notificationSound";
import { getOrderItemCount, getOrderItemSummary } from "@/utils/orderNotification";
import { formatOrderNumber } from "@/utils/orderNumber";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrderAddress {
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  area: string;
  postalCode: string;
  phone: string;
  line1: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderNotification {
  id: string;           // Pusher event de-dup key
  _id: string;          // MongoDB order _id
  orderNumber?: number;
  customerName: string;
  phoneNumber: string;
  bill: number;
  payment: string;
  status: string;
  type: string;
  items: OrderItem[];
  address: OrderAddress;
  createdAt: string;
  couponCode?: string;
  couponDiscount?: number;
  userId?: string;
  readAt?: number;      // local-only timestamp when admin dismissed
}

const STORAGE_KEY = "admin_order_notifications";

/** @deprecated No longer skips admin alerts; kept for checkout call sites. */
export function markSelfPlacedOrder(_orderId: string) {
  /* no-op — admins should see every new order notification */
}

function isAdminRecipient(user: { role?: string; adminAccess?: boolean } | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.adminAccess === true;
}

interface NotificationContextValue {
  notifications: OrderNotification[];
  unreadCount: number;
  connected: boolean;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

function loadFromStorage(): OrderNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OrderNotification[];
  } catch {
    return [];
  }
}

function saveToStorage(items: OrderNotification[]) {
  try {
    // Keep at most 50 notifications
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    /* ignore quota errors */
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const NotificationCtx = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  connected: false,
  markAllRead: () => {},
  markRead: () => {},
  clearAll: () => {},
});

// ─── Toast Component for Realtime Popups ──────────────────────────────────────
function ToastNotificationCard({
  toast,
  onClose,
}: {
  toast: OrderNotification;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const brand = getBrandThemeColors(theme);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const totalItems = getOrderItemCount(toast.items);
  const { label: itemSummary } = getOrderItemSummary(toast.items);
  const productImage = toast.items?.find((it) => it.image)?.image;

  return (
    <div
      style={{
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${hexToRgba(brand.primary, 0.25)}`,
        borderRadius: 16,
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${hexToRgba(brand.primary, 0.05)}`,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "auto",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Decorative gradient bar on the left */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: `linear-gradient(to bottom, ${brand.primary}, ${brand.dark})`,
        }}
      />

      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {productImage ? (
            <img
              src={productImage}
              alt={toast.items?.[0]?.name || "Order item"}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                objectFit: "cover",
                border: `1px solid ${hexToRgba(brand.primary, 0.2)}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${hexToRgba(brand.primary, 0.15)}, ${hexToRgba(brand.dark, 0.15)})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 16 }}>🛒</span>
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>
              New Order Received!
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500 }}>
              Just now • Realtime Notification
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(0, 0, 0, 0.05)",
            border: "none",
            borderRadius: "50%",
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748B",
            fontSize: 12,
            transition: "background 0.2s",
          }}
        >
          ✕
        </button>
      </div>

      {/* Order Info */}
      <div style={{ fontSize: 13, color: "#334155", paddingLeft: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#64748B" }}>Customer:</span>
          <span style={{ color: "#0F172A", fontWeight: 700 }}>{toast.customerName}</span>
        </div>
        {itemSummary && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#64748B" }}>Item:</span>
            <span style={{ color: "#0F172A", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{itemSummary}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#64748B" }}>Total Bill:</span>
          <span style={{ color: "#059669", fontWeight: 800 }}>{formatStoreMoney(toast.bill || 0)}</span>
        </div>
        {toast.couponCode && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#64748B" }}>Coupon Applied:</span>
            <span style={{ color: brand.primary, fontWeight: 700 }}>
              {toast.couponCode} (-{formatStoreMoney(toast.couponDiscount || 0)})
            </span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "#64748B" }}>Payment:</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>{toast.payment}</span>
        </div>
        {toast.phoneNumber && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: "#64748B" }}>Phone:</span>
            <span style={{ color: "#475569", fontWeight: 600 }}>{toast.phoneNumber}</span>
          </div>
        )}
      </div>

      {/* Items Preview */}
      {toast.items && toast.items.length > 0 && (
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 11,
            color: "#475569",
            border: "1px solid #F1F5F9",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Items ({totalItems})
          </div>
          <div style={{ maxHeight: 60, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {toast.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.name} <span style={{ color: "#94A3B8" }}>×{item.quantity}</span></span>
                <span style={{ fontWeight: 600 }}>{formatStoreMoney((item.price || 0) * (item.quantity || 0))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-closing Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "#E2E8F0",
        }}
      >
        <div
          style={{
            height: "100%",
            background: `linear-gradient(to right, ${brand.primary}, ${brand.dark})`,
            animation: "toastProgress 8s linear forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<OrderNotification[]>(loadFromStorage);
  const [toasts, setToasts] = useState<OrderNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef<Set<string>>(new Set(loadFromStorage().map((n) => n._id)));

  // Persist whenever notifications change
  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const addNotification = useCallback((raw: Omit<OrderNotification, "id" | "readAt">) => {
    // Always notify admins of every new order (including self-test checkouts).
    // De-duplicate by MongoDB _id only.
    if (seenIds.current.has(raw._id)) return;
    seenIds.current.add(raw._id);

    const notification: OrderNotification = {
      ...raw,
      id: raw._id,
      createdAt: raw.createdAt || new Date().toISOString(),
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 50));

    playOrderNotificationSound();

    // Show a real-time toast popup on the right side of the screen
    setToasts((prev) => [...prev, notification]);

    // Automatically remove the toast after 8 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notification.id));
    }, 8000);

    // Browser notification (if permission granted)
    if ("Notification" in window && Notification.permission === "granted") {
      const { label: itemSummary } = getOrderItemSummary(notification.items);
      const itemPart = itemSummary ? ` ordered ${itemSummary}` : " placed an order";
      new Notification("🛒 New Order Received!", {
        body: `${notification.customerName}${itemPart} — ${formatStoreMoney(notification.bill || 0)}`,
        icon: "/favicon.ico",
      });
    }
  }, []);

  // ── Pusher subscription ───────────────────────────────────────────────────
  useEffect(() => {
    const unlock = () => unlockNotificationAudio();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isAdminRecipient(user)) return;

    let channel: ReturnType<ReturnType<typeof getPusher>["subscribe"]> | null = null;
    let cancelled = false;
    let idleHandle: number | undefined;
    let usedIdleCallback = false;

    const connect = () => {
      if (cancelled) return;
      const pusher = getPusher();
      channel = pusher.subscribe("admin-notifications");

      pusher.connection.bind("connected", () => setConnected(true));
      pusher.connection.bind("disconnected", () => setConnected(false));
      pusher.connection.bind("error", () => setConnected(false));

      if (pusher.connection.state === "connected") setConnected(true);

      channel.bind("new-order", (data: Omit<OrderNotification, "id" | "readAt">) => {
        addNotification(data);
      });

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    };

    // Defer realtime until after first paint so admin shell isn't blocked
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      usedIdleCallback = true;
      idleHandle = window.requestIdleCallback(connect, { timeout: 2500 });
    } else {
      idleHandle = setTimeout(connect, 1200) as unknown as number;
    }

    return () => {
      cancelled = true;
      if (idleHandle != null) {
        if (usedIdleCallback && typeof window !== "undefined" && "cancelIdleCallback" in window) {
          window.cancelIdleCallback(idleHandle);
        } else {
          clearTimeout(idleHandle);
        }
      }
      if (channel) {
        channel.unbind("new-order");
        try {
          getPusher().unsubscribe("admin-notifications");
        } catch {
          /* ignore */
        }
      }
      disconnectPusher();
      setConnected(false);
    };
  }, [addNotification, user]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: Date.now() } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: Date.now() })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    seenIds.current.clear();
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationCtx.Provider
      value={{ notifications, unreadCount, connected, markAllRead, markRead, clearAll }}
    >
      {children}

      {/* Floating container for real-time order alerts at top-right side */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastNotificationCard
            key={toast.id}
            toast={toast}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </NotificationCtx.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNotifications() {
  return useContext(NotificationCtx);
}