import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserOrders,
  getOrderById,
  cancelOrder,
  returnOrder,
  getUserWishlist,
  removeFromWishlist,
} from "@/api/user.api";
import { createQuery, getMyQueries, type SupportQuery } from "@/api/query.api";
import { spacing } from "@/utils/spacing";
import { createReview, getUserReviews } from "@/api/review.api";
import { getProducts } from "@/api/product.api";
import { getEnabledProfilePages, getProfilePageBySlug, getEnabledBaseProfileTabs } from "@/api/profilepage.api";
import { useToast } from "@/components/ui/toast";
import { playCustomerSuccessSound } from "@/utils/notificationSound";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageLoader from "@/components/ui/PageLoader";
import FilterTabs from "@/components/ui/FilterTabs";
import { Input } from "@/components/ui/input";
import { updateAvatar } from "@/api/auth.api";
import {
  User,
  Package,
  MapPin,
  Heart,
  MessageSquare,
  Star,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  MoreVertical,
  Truck,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProductCard from "@/components/products/ProductCard";
import type { UserProfile as UserProfileType, Address, Order } from "@/api/user.api";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { formatOrderNumber } from "@/utils/orderNumber";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  formatReturnReason,
  getPaymentType,
  normalizeOrderStatus,
} from "@/utils/orderDisplay";

type TabType =
  | "dashboard"
  | "profile"
  | "addresses"
  | "orders"
  | "track-order"
  | "wishlist"
  | "queries"
  | "reviews"
  | "user-report"
  | string;

const PROFILE_WRAP = "max-w-[1232px] mx-auto px-4 sm:px-6 md:px-8";
const PROFILE_PANEL_PAD = "p-4 sm:p-6 md:p-8";
const PROFILE_INNER_CARD = "border rounded-lg px-4 py-4 sm:px-5";
const PROFILE_TITLE = "text-xl sm:text-2xl font-bold theme-heading";
const PROFILE_TABS_SCROLL = "profile-tabs-scroll overflow-x-auto";

function ProfileAvatarCircle({
  src,
  name,
  sizeClass = "w-20 h-20",
  textClass = "text-2xl",
}: {
  src?: string | null;
  name?: string;
  sizeClass?: string;
  textClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.charAt(0) || "U").toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center shrink-0 border-2`}
        style={{ borderColor: "var(--theme-primary, #8B5E3C)" }}
      >
        <span className={`${textClass} font-bold text-gray-700`}>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Profile"}
      className={`${sizeClass} rounded-full object-cover shrink-0 border-2`}
      style={{ borderColor: "var(--theme-primary, #8B5E3C)" }}
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
    />
  );
}

export default function UserProfile() {
  console.log('🚀🚀🚀 UserProfile component RENDERED 🚀🚀🚀');
  
  // Add class to body/html/root to match background
  useEffect(() => {
    document.body.classList.add('profile-page');
    document.documentElement.classList.add('profile-page');
    const root = document.getElementById('root');
    if (root) root.classList.add('profile-page');
    
    return () => {
      document.body.classList.remove('profile-page');
      document.documentElement.classList.remove('profile-page');
      if (root) root.classList.remove('profile-page');
    };
  }, []);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const tabFromUrl = (searchParams.get("tab") || "").trim();
  const [activeTab, setActiveTab] = useState<TabType>(
    (tabFromUrl as TabType) || "profile"
  );
  
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [profilePages, setProfilePages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Base tabs from Developer → Profile Pages (enabled only)
  const [baseTabsFromAPI, setBaseTabsFromAPI] = useState<any[]>([]);
  const [baseTabsLoaded, setBaseTabsLoaded] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return;
    }
    
    if (!authUser) {
      navigate("/login");
      return;
    }
    
    // Double check token exists before loading data
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    loadData();
  }, [authUser, authLoading, navigate]);

  const loadData = async () => {
    // Check token AND authUser before making any API calls
    const token = localStorage.getItem("token");
    if (!token || !authUser) {
      setLoading(false);
      return; // Don't make any API calls if no token or user
    }
    
    try {
      setLoading(true);
      // Only make API calls if we have both token and authUser
      const [profileData, addressesData, ordersData, wishlistData, profilePagesData, baseTabsData] = await Promise.all([
        getUserProfile().catch(() => null), // Silently catch all errors
        getUserAddresses().catch(() => {
          // Fallback to localStorage if backend fails
          try {
            const savedAddresses = localStorage.getItem("savedAddresses");
            if (savedAddresses) {
              const parsed = JSON.parse(savedAddresses);
              return Array.isArray(parsed) ? parsed : [];
            }
          } catch (e) {
            // Silent
          }
          return [];
        }),
        getUserOrders().catch(() => []), // Silently catch all errors
        getUserWishlist().catch(() => []), // Silently catch all errors
        getEnabledProfilePages().catch((err) => {
          console.error("Failed to load profile pages:", err);
          return [];
        }),
        getEnabledBaseProfileTabs().catch((err) => {
          console.error("Failed to load base tabs from API:", err);
          return null;
        }),
      ]);
      
      if (profileData) {
        // Process avatar URL for production/Vercel
        if (profileData.avatar) {
          const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((url: string) => url.trim()).filter(Boolean);
          const isLocalhost = typeof window !== 'undefined' && (
            window.location.hostname === "localhost" || 
            window.location.hostname === "127.0.0.1"
          );
          const API_BASE_URL = isLocalhost ? urls[0] : (urls[1] || urls[0] || import.meta.env.VITE_API_URL || "");
          const apiBaseWithoutApi = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';
          
          let avatarUrl = profileData.avatar;
          if (avatarUrl) {
            // If it's a localhost URL (from development), replace with production API URL
            if (avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1')) {
              const urlPath = avatarUrl.replace(/^https?:\/\/[^\/]+/, '');
              avatarUrl = `${apiBaseWithoutApi}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;
            } else if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
              // Already a full URL (Cloudinary or production) - use directly
              avatarUrl = avatarUrl;
            } else {
              // Relative path - construct full URL
              avatarUrl = `${apiBaseWithoutApi}${avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl}`;
            }
          }
          
          console.log("UserProfile - Avatar URL processing:", {
            original: profileData.avatar,
            isCloudinary: profileData.avatar?.includes('cloudinary'),
            final: avatarUrl,
            apiBase: API_BASE_URL,
            apiBaseWithoutApi
          });
          
          profileData.avatar = avatarUrl;
        }
        setProfile(profileData);
      }
      console.log("Loaded addresses:", addressesData);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      // Filter out null/undefined products from wishlist
      // Backend returns products directly (from wishlist.map(item => item.productId))
      // So we need to handle both cases: direct product objects or nested productId
      const validWishlist = Array.isArray(wishlistData) 
        ? wishlistData
            .map((item: any) => {
              // Handle both direct product objects and nested productId
              const product = item?.productId || item;
              return product && product._id ? product : null;
            })
            .filter((item: any) => item !== null)
        : [];
      console.log("Wishlist data processed:", validWishlist);
      setWishlist(validWishlist);
      
      // Handle profile pages data (CUSTOM pages only, not base tabs)
      // Base tabs are handled via localStorage in the useMemo hook
      console.log("Profile pages API response (CUSTOM pages only):", profilePagesData);
      if (Array.isArray(profilePagesData)) {
        setProfilePages(profilePagesData);
        console.log(`Loaded ${profilePagesData.length} enabled CUSTOM profile pages`);
      } else if (profilePagesData && Array.isArray(profilePagesData.data)) {
        setProfilePages(profilePagesData.data);
        console.log(`Loaded ${profilePagesData.data.length} enabled CUSTOM profile pages`);
      } else {
        console.warn("Invalid profile pages data format:", profilePagesData);
        setProfilePages([]);
        console.log("No CUSTOM profile pages found. Base tabs are handled via API.");
      }
      
      // Enabled base tabs only (Developer → Profile Pages toggles)
      if (Array.isArray(baseTabsData)) {
        setBaseTabsFromAPI(baseTabsData);
      } else if (baseTabsData && Array.isArray((baseTabsData as any).data)) {
        setBaseTabsFromAPI((baseTabsData as any).data);
      } else {
        // API failed — keep core pages available so the user is not locked out
        setBaseTabsFromAPI([
          { _id: "profile", enabled: true, order: 2 },
          { _id: "addresses", enabled: true, order: 3 },
        ]);
      }
      setBaseTabsLoaded(true);
    } catch (err: any) {
      console.error("Error loading data:", err);
      error(err.message || "Failed to load data");
      setBaseTabsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Re-sync enabled tabs when window regains focus (after admin toggles)
  useEffect(() => {
    const refreshBaseTabs = async () => {
      try {
        const baseTabsData = await getEnabledBaseProfileTabs();
        if (Array.isArray(baseTabsData)) {
          setBaseTabsFromAPI(baseTabsData);
        } else if (baseTabsData && Array.isArray((baseTabsData as any).data)) {
          setBaseTabsFromAPI((baseTabsData as any).data);
        }
        setBaseTabsLoaded(true);
      } catch (err) {
        console.error("Failed to refresh base tabs:", err);
      }
    };

    const onFocus = () => {
      void refreshBaseTabs();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const allBaseTabs = useMemo(
    () => [
      { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard },
      { id: "profile" as TabType, label: "Profile", icon: User },
      { id: "addresses" as TabType, label: "Address", icon: MapPin },
      { id: "wishlist" as TabType, label: "Wishlist", icon: Heart },
      { id: "orders" as TabType, label: "Orders", icon: Package },
      { id: "track-order" as TabType, label: "Track Order", icon: Truck },
      { id: "reviews" as TabType, label: "Reviews", icon: Star },
      { id: "queries" as TabType, label: "Support", icon: MessageSquare },
      { id: "user-report" as TabType, label: "Report", icon: Flag },
    ],
    []
  );

  /**
   * getEnabledBaseProfileTabs returns ONLY enabled tabs.
   * Tabs missing from that list are disabled — never show them as a fallback.
   */
  const baseTabs = useMemo(() => {
    if (!baseTabsLoaded) return [];
    const enabledIds = new Set(
      baseTabsFromAPI.map((t: any) => String(t._id || t.id || "")).filter(Boolean)
    );
    const orderMap = new Map(
      baseTabsFromAPI.map((t: any, i: number) => [
        String(t._id || t.id || ""),
        typeof t.order === "number" ? t.order : i + 1,
      ])
    );
    return allBaseTabs
      .filter((tab) => enabledIds.has(String(tab.id)))
      .sort(
        (a, b) =>
          (orderMap.get(String(a.id)) ?? 99) - (orderMap.get(String(b.id)) ?? 99)
      );
  }, [allBaseTabs, baseTabsFromAPI, baseTabsLoaded]);

  const profilePageTabs = useMemo(
    () =>
      profilePages
        .filter((page: any) => page.enabled !== false)
        .map((page: any) => ({
          id: `profile-page-${page._id}` as TabType,
          label: page.title,
          icon: FileText,
          isProfilePage: true,
          pageData: page,
        })),
    [profilePages]
  );

  const tabs = useMemo(
    () => [...baseTabs, ...profilePageTabs],
    [baseTabs, profilePageTabs]
  );

  const selectTab = useCallback(
    (tabId: TabType) => {
      setActiveTab(tabId);
      const next = new URLSearchParams(searchParams);
      next.set("tab", String(tabId));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Keep active tab on an enabled page; honor ?tab= when valid
  useEffect(() => {
    if (!baseTabsLoaded || tabs.length === 0) return;

    const urlTab = (searchParams.get("tab") || "").trim();
    if (urlTab && tabs.some((t) => t.id === urlTab)) {
      if (activeTab !== urlTab) setActiveTab(urlTab as TabType);
      return;
    }

    if (!tabs.some((t) => t.id === activeTab)) {
      selectTab(tabs[0].id);
    }
  }, [tabs, activeTab, baseTabsLoaded, searchParams, selectTab]);

  if (loading) {
    return (
      <div data-profile-page style={{ backgroundColor: "#F5F5F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div className={`flex items-center justify-center flex-1 ${spacing.navbar.offset}`}>
          <PageLoader />
        </div>
        <div className="w-full" style={{ marginTop: "auto", flexShrink: 0, paddingTop: "20px" }}>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div data-profile-page style={{ backgroundColor: "#F5F5F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} w-full flex-1`} style={{ minHeight: 0 }}>
        <section className="w-full pb-6 sm:pb-8" style={{ minHeight: 0, paddingTop: "20px", paddingBottom: "0px", marginBottom: "0px" }}>
          <div className={PROFILE_WRAP}>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className={`w-full md:w-64 bg-white rounded-lg shadow ${PROFILE_PANEL_PAD}`}>
            <div className="mb-6">
              <div className="flex justify-center mb-3">
                <ProfileAvatarCircle
                  src={profile?.avatar}
                  name={profile?.name || authUser?.name}
                />
              </div>
              <h3 className="text-center font-semibold text-gray-900 px-1">{profile?.name || authUser?.name}</h3>
              <p className="text-center text-sm text-gray-600 break-all px-2 mt-1">{profile?.email || authUser?.email}</p>
            </div>
            <nav className={`flex md:flex-col gap-1 ${PROFILE_TABS_SCROLL} md:overflow-visible pb-2 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0`}>
              {tabs.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tabs available
                </div>
              ) : (
                tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => selectTab(tab.id)}
                        className={`shrink-0 md:shrink md:w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? "text-white font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={activeTab === tab.id ? { backgroundColor: "var(--theme-primary)" } : {}}
                      >
                        <Icon size={18} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className={`flex-1 bg-white rounded-lg shadow ${PROFILE_PANEL_PAD}`} style={{ minHeight: "auto" }}>
            {activeTab === "dashboard" && (
              <DashboardTab
                orders={orders}
                addresses={addresses}
                wishlist={wishlist}
                onTabChange={selectTab}
                enabledTabIds={new Set(tabs.map((t) => String(t.id)))}
              />
            )}
            {activeTab === "profile" && <ProfileTab profile={profile} onUpdate={loadData} />}
            {activeTab === "addresses" && <AddressesTab addresses={addresses} onUpdate={loadData} />}
            {activeTab === "orders" && <OrdersTab orders={orders} onUpdate={loadData} />}
            {activeTab === "track-order" && <TrackOrderTab orders={orders} />}
            {activeTab === "wishlist" && <WishlistTab wishlist={wishlist} onUpdate={loadData} />}
            {activeTab === "queries" && <QueriesTab />}
            {activeTab === "reviews" && <ReviewsTab orders={orders} />}
            {activeTab === "user-report" && <UserReportTab />}
            {/* Profile Pages */}
            {activeTab.startsWith("profile-page-") && (() => {
              const pageId = activeTab.replace("profile-page-", "");
              const page = profilePages.find((p: any) => p._id === pageId);
              console.log("Rendering profile page:", { pageId, page, allPages: profilePages });
              if (!page) {
                return (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Profile page not found.</p>
                  </div>
                );
              }
              return (
                <div>
                  <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>{page.title}</h2>
                  {page.subInfo && (
                    <p className="text-gray-600 mb-4">{page.subInfo}</p>
                  )}
                  <div 
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: page.content || "<p>No content available.</p>" }}
                  />
                </div>
              );
            })()}
          </div>
          </div>
        </div>
        </section>
      </main>
      <div className="w-full" style={{ marginTop: "auto", flexShrink: 0, paddingTop: "20px", paddingBottom: "0", marginBottom: "0" }}>
        <Footer />
      </div>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({
  orders,
  addresses,
  wishlist,
  onTabChange,
  enabledTabIds,
}: {
  orders: Order[];
  addresses: Address[];
  wishlist: any[];
  onTabChange: (tab: TabType) => void;
  enabledTabIds: Set<string>;
}) {
  const { formatMoney } = useStoreCurrency();
  const recentOrders = orders.slice(0, 3);
  const pendingOrders = orders.filter(o => o.status === "Pending").length;
  const can = (id: string) => enabledTabIds.has(id);

  const quickActions = [
    can("orders") && {
      id: "orders",
      label: "View All Orders",
      icon: Package,
      onClick: () => onTabChange("orders"),
    },
    can("addresses") && {
      id: "addresses",
      label: "Manage Addresses",
      icon: MapPin,
      onClick: () => onTabChange("addresses"),
    },
    can("wishlist") && {
      id: "wishlist",
      label: `Wishlist (${wishlist.length})`,
      icon: Heart,
      onClick: () => onTabChange("wishlist"),
    },
    can("queries") && {
      id: "queries",
      label: "Get Support",
      icon: MessageSquare,
      onClick: () => onTabChange("queries"),
    },
  ].filter(Boolean) as {
    id: string;
    label: string;
    icon: typeof Package;
    onClick: () => void;
  }[];
  
  return (
    <div>
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>Dashboard</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="theme-bg-light p-4 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-1">Pending Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600 mb-1">Saved Address</h3>
          <p className="text-2xl font-bold text-gray-900">{addresses.length}</p>
        </div>
      </div>

      {/* Recent Orders */}
      {can("orders") ? (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order._id} className={PROFILE_INNER_CARD}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">Order {formatOrderNumber(order.orderNumber, order._id)}</p>
                    <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-900">{formatMoney(order.bill)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                    order.status === "Complete" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      ) : null}

      {/* Quick Links */}
      {quickActions.length > 0 ? (
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="p-4 border rounded-lg hover:bg-gray-50 text-center"
              >
                <Icon size={24} className="mx-auto mb-2 text-gray-700" />
                <p className="text-sm text-gray-700">{action.label}</p>
              </button>
            );
          })}
        </div>
      </div>
      ) : null}
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ profile, onUpdate }: { profile: UserProfileType | null; onUpdate: () => void }) {
  const { success, error } = useToast();
  const [tab, setTab] = useState<"overview" | "edit" | "password">("overview");
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
  });
  
  // Update formData when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(profile?.avatar);

  // Update avatar when profile changes
  useEffect(() => {
    if (profile?.avatar) {
      // Handle avatar URL for production/Vercel
      const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((url: string) => url.trim()).filter(Boolean);
      const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1"
      );
      const API_BASE_URL = isLocalhost ? urls[0] : (urls[1] || urls[0] || import.meta.env.VITE_API_URL || "");
      const apiBaseWithoutApi = API_BASE_URL ? API_BASE_URL.replace('/api', '') : '';
      
      let avatarUrl = profile.avatar;
      if (avatarUrl) {
        // If it's a localhost URL (from development), replace with production API URL
        if (avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1')) {
          const urlPath = avatarUrl.replace(/^https?:\/\/[^\/]+/, '');
          avatarUrl = `${apiBaseWithoutApi}${urlPath.startsWith('/') ? urlPath : '/' + urlPath}`;
        } else if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
          // Already a full URL (Cloudinary or production) - use directly
          avatarUrl = avatarUrl;
        } else {
          // Relative path - construct full URL
          avatarUrl = `${apiBaseWithoutApi}${avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl}`;
        }
      }
      setProfileAvatar(avatarUrl);
    }
  }, [profile?.avatar]);

  // File select handler
  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setEditAvatarFile(file);
    setEditAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      error("Please login to update profile");
      return;
    }

    try {
      setSavingProfile(true);
      
      let newAvatar: string | undefined = profile?.avatar;

      // Upload avatar if file selected
      if (editAvatarFile) {
        try {
          const res = await updateAvatar(editAvatarFile, token);
          newAvatar = res.avatar;
          setEditAvatarPreview(null);
          setEditAvatarFile(null);
          setProfileAvatar(newAvatar);
        } catch (avatarErr: any) {
          console.error("Avatar upload error:", avatarErr);
          const errorMessage = avatarErr?.response?.data?.message || avatarErr?.message || "Failed to upload avatar";
          error(errorMessage);
          throw avatarErr; // Re-throw to stop profile update
        }
      }

      // Update profile
      await updateUserProfile(formData);
      
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(""), 3000);
      onUpdate();
    } catch (err: any) {
      setProfileMsg("Failed to update profile");
      setTimeout(() => setProfileMsg(""), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      error("Please fill in all password fields");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error("New passwords do not match");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      error("New password must be at least 6 characters long");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordMsg("Password updated successfully!");
      setTimeout(() => setPasswordMsg(""), 3000);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswords({ current: false, new: false, confirm: false });
    } catch (err: any) {
      setPasswordMsg("Failed to update password");
      setTimeout(() => setPasswordMsg(""), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full text-black">
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>Profile Settings</h2>

      {/* PROFILE BOX */}
      <div className="flex items-start gap-3 sm:gap-4 mb-6">
        <ProfileAvatarCircle
          src={editAvatarPreview || profileAvatar}
          name={profile?.name}
        />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{profile?.name || "User"}</h3>
          <p className="text-sm text-gray-500 break-all mt-1">{profile?.email || "N/A"}</p>
        </div>
      </div>

      {/* TABS */}
      <div className={`mb-4 ${PROFILE_TABS_SCROLL} md:overflow-visible`}>
        <FilterTabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "edit", label: "Edit" },
            { id: "password", label: "Password" },
          ]}
          activeTab={tab}
          onTabChange={(tabId) => setTab(tabId as any)}
        />
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="py-4 px-4 sm:p-6 bg-gray-50 rounded-lg" style={{ minHeight: "auto" }}>
          <h3 className="font-semibold mb-3">Profile Details</h3>
          <p><strong>Full Name:</strong> {profile?.name || "N/A"}</p>
          <p><strong>Email:</strong> {profile?.email || "N/A"}</p>
          <p><strong>Phone:</strong> {profile?.phone || "N/A"}</p>
        </div>
      )}

      {/* EDIT PROFILE */}
      {tab === "edit" && (
        <div className="py-4 px-4 sm:p-6 bg-gray-50 text-black rounded-lg space-y-4">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <button
              type="button"
              className="shrink-0 rounded-full focus:outline-none cursor-pointer"
              onClick={() => document.getElementById("avatarInputEdit")?.click()}
            >
              <ProfileAvatarCircle
                src={editAvatarPreview || profileAvatar}
                name={profile?.name}
              />
            </button>
            <input
              type="file"
              accept="image/*"
              id="avatarInputEdit"
              className="hidden"
              onChange={handleEditAvatarChange}
            />
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-medium text-gray-900">Profile photo</p>
              <p className="text-xs text-gray-500 break-all mt-1">{profile?.email || "N/A"}</p>
              <p className="text-xs text-gray-500 mt-1">Tap image to change</p>
            </div>
          </div>

          <div>
            <label className="font-medium">Full Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="font-medium">Email</label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="font-medium">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <button 
            onClick={handleUpdateProfile} 
            disabled={savingProfile}
            className="px-4 h-12 theme-button text-white rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>

          {profileMsg && (
            <p className={`mt-2 ${profileMsg.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
              {profileMsg}
            </p>
          )}
        </div>
      )}

      {/* PASSWORD */}
      {tab === "password" && (
        <div className="py-4 px-4 sm:p-6 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="font-medium">Current Password</label>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
              <span
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <div>
            <label className="font-medium">New Password</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
              <span
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <div>
            <label className="font-medium">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
              <span
                className="absolute right-3 top-3 cursor-pointer"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword}
            className="px-4 h-12 theme-button text-white rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </button>
          
          {passwordMsg && (
            <p className={`mt-2 ${passwordMsg.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
              {passwordMsg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Addresses Tab Component
function AddressesTab({ addresses, onUpdate }: { addresses: Address[]; onUpdate: () => void }) {
  const { success, error } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Address, "_id">>({
    firstName: "",
    lastName: "",
    province: "",
    city: "",
    area: "",
    postalCode: "",
    phone: "",
    line1: "",
    isDefault: false,
  });

  const handleAdd = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.phone || 
        !formData.line1 || !formData.city || !formData.province || !formData.postalCode) {
      error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedAddresses = await addUserAddress(formData);
      success("Address added successfully!");
      setShowAddForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        province: "",
        city: "",
        area: "",
        postalCode: "",
        phone: "",
        line1: "",
        isDefault: false,
      });
      // Force refresh to get latest data
      await onUpdate();
    } catch (err: any) {
      console.error("Error adding address:", err);
      error(err.response?.data?.message || err.message || "Failed to add address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (addressId: string) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      await updateUserAddress(addressId, formData);
      success("Address updated successfully!");
      setEditingId(null);
      onUpdate();
    } catch (err: any) {
      error(err.message || "Failed to update address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const handleDelete = (addressId: string) => {
    setDeleteConfirm(addressId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUserAddress(deleteConfirm);
      success("Address deleted successfully!");
      setDeleteConfirm(null);
      onUpdate();
    } catch (err: any) {
      error(err.message || "Failed to delete address");
      setDeleteConfirm(null);
    }
  };

  const startEdit = (address: Address) => {
    setEditingId(address._id || null);
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      province: address.province,
      city: address.city,
      area: address.area || "",
      postalCode: address.postalCode,
      phone: address.phone,
      line1: address.line1,
      isDefault: address.isDefault || false,
    });
  };

  return (
    <div>
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${spacing.inner.gapBottom}`}>
        <h2 className={PROFILE_TITLE}>Address</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="theme-button flex items-center justify-center gap-2 px-4 h-11 sm:h-12 rounded-lg w-full sm:w-auto"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {showAddForm && (
        <div className={`mb-6 ${PROFILE_INNER_CARD}`}>
          <h3 className="font-semibold mb-4 text-gray-900">Add</h3>
          <AddressForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleAdd}
            isSubmitting={isSubmitting}
            onCancel={() => {
              setShowAddForm(false);
              setFormData({
                firstName: "",
                lastName: "",
                province: "",
                city: "",
                area: "",
                postalCode: "",
                phone: "",
                line1: "",
                isDefault: false,
              });
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div>
            <p className="text-gray-600 mb-2">No addresses saved yet</p>
            <p className="text-sm text-gray-500">Add your first address using the button above</p>
          </div>
        ) : (
          addresses.map((address) => (
            <div key={address._id} className={PROFILE_INNER_CARD}>
              {editingId === address._id ? (
                <AddressForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={() => handleUpdate(address._id!)}
                  isSubmitting={isSubmitting}
                  onCancel={() => {
                    setEditingId(null);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      province: "",
                      city: "",
                      area: "",
                      postalCode: "",
                      phone: "",
                      line1: "",
                      isDefault: false,
                    });
                  }}
                />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {address.isDefault && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mb-2">
                          Default
                        </span>
                      )}
                      <p className="font-semibold text-gray-900">{address.firstName} {address.lastName}</p>
                      <p className="text-sm text-gray-700">{address.line1}</p>
                      {address.area && <p className="text-sm text-gray-700">{address.area}</p>}
                      <p className="text-sm text-gray-700">{address.city}, {address.province}</p>
                      <p className="text-sm text-gray-700">Postal: {address.postalCode}</p>
                      <p className="text-sm text-gray-700">Phone: {address.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(address)}
                        className="p-2 theme-text-primary rounded hover:bg-gray-100"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(address._id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Address Form Component
function AddressForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  isSubmitting = false,
}: {
  formData: Omit<Address, "_id">;
  setFormData: (data: Omit<Address, "_id">) => void;
  onSave: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Phone *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full border rounded-lg p-2 text-gray-900"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Address Line 1 *</label>
        <input
          type="text"
          value={formData.line1}
          onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
          className="w-full border rounded-lg p-2 text-gray-900"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Area</label>
        <input
          type="text"
          value={formData.area}
          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          className="w-full border rounded-lg p-2 text-gray-900"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">City *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Province *</label>
          <input
            type="text"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            className="w-full border rounded-lg p-2 text-gray-900"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">Postal Code *</label>
        <input
          type="text"
          value={formData.postalCode}
          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
          className="w-full border rounded-lg p-2 text-gray-900"
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4"
        />
        <label className="text-sm text-gray-700">Set as default address</label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="theme-button px-4 h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ orders, onUpdate }: { orders: Order[]; onUpdate: () => void }) {
  const { success, error } = useToast();
  const { formatMoney } = useStoreCurrency();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [returnConfirm, setReturnConfirm] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const closeCancelDialog = () => {
    if (isCancelling) return;
    setCancelConfirm(null);
    setCancelReason("");
  };

  const closeReturnDialog = () => {
    if (isReturning) return;
    setReturnConfirm(null);
    setReturnReason("");
  };

  const canReturnOrder = (status: string) => {
    const normalized = normalizeOrderStatus(status);
    return normalized === "Delivered" || normalized === "Completed" || normalized === "Order Confirmed";
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      const order = await getOrderById(orderId);
      setSelectedOrder(order);
      setShowDetailsModal(true);
    } catch (err: any) {
      error(err.message || "Failed to load order details");
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setCancelReason("");
    setCancelConfirm(orderId);
  };

  const handleReturnOrder = (orderId: string) => {
    setReturnReason("");
    setReturnConfirm(orderId);
  };

  const confirmReturnOrder = async () => {
    if (!returnConfirm) return;
    const reason = returnReason.trim();
    if (!reason) {
      error("Please provide a return reason");
      return;
    }
    setIsReturning(true);
    try {
      await returnOrder(returnConfirm, reason);
      success("Return request submitted successfully!");
      setReturnConfirm(null);
      setReturnReason("");
      onUpdate();
    } catch (err: any) {
      error(err.message || "Failed to return order");
    } finally {
      setIsReturning(false);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelConfirm) return;
    const reason = cancelReason.trim();
    if (!reason) {
      error("Please provide a cancellation reason");
      return;
    }
    setIsCancelling(true);
    try {
      await cancelOrder(cancelConfirm, reason);
      success("Order cancelled successfully! Admin has been notified.");
      setCancelConfirm(null);
      setCancelReason("");
      onUpdate(); // Refresh orders list
    } catch (err: any) {
      error(err.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div>
      {returnConfirm !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Return Order</h3>
            <p className="text-sm text-gray-700 mb-4">
              Please tell us why you want to return this order.
            </p>
            <label className="block text-sm font-medium text-gray-800 mb-2" htmlFor="return-reason">
              Return reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="return-reason"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Please tell us why you want to return this order..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--theme-primary) focus:border-(--theme-primary) text-gray-900 resize-none mb-4"
              disabled={isReturning}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={closeReturnDialog}
                disabled={isReturning}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={confirmReturnOrder}
                disabled={isReturning || !returnReason.trim()}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isReturning ? "Submitting..." : "Return Order"}
              </button>
            </div>
          </div>
        </div>
      )}
      {cancelConfirm !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Order</h3>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <label className="block text-sm font-medium text-gray-800 mb-2" htmlFor="cancel-reason">
              Cancellation reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please tell us why you want to cancel this order..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--theme-primary) focus:border-(--theme-primary) text-gray-900 resize-none mb-4"
              disabled={isCancelling}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={closeCancelDialog}
                disabled={isCancelling}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>My Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className={PROFILE_INNER_CARD}>
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">Order {formatOrderNumber(order.orderNumber, order._id)}</p>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusBadge status={order.status} type="order" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                        aria-label="Order actions"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 z-50">
                      <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewDetails(order._id)}>
                        View Details
                      </DropdownMenuItem>
                      {/* {order.status === "Pending" && (
                        <DropdownMenuItem
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isCancelling}
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          {isCancelling && cancelConfirm === order._id ? "Cancelling..." : "Cancel Order"}
                        </DropdownMenuItem>
                      )} */}
                      {/* {canReturnOrder(order.status) && (
                        <DropdownMenuItem
                          onClick={() => handleReturnOrder(order._id)}
                          disabled={isReturning}
                          className="text-amber-700 focus:text-amber-700 cursor-pointer"
                        >
                          {isReturning && returnConfirm === order._id ? "Returning..." : "Return Order"}
                        </DropdownMenuItem>
                      )} */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm mb-2 text-gray-900"><strong className="text-gray-700">Items:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-900 break-words">
                      {item.name} x {item.quantity} - {formatMoney(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <p className="text-sm text-gray-700">
                  <strong className="text-gray-900">Total:</strong> {formatMoney(order.bill)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong className="text-gray-900">Payment:</strong> {getPaymentType(order)}
                </p>
                {formatReturnReason(order) && (
                  <p className="text-sm text-amber-900">
                    <strong className="text-gray-900">Return:</strong> {formatReturnReason(order)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center gap-3 mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Order Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Order</p>
                  <p className="font-semibold text-gray-900">{formatOrderNumber(selectedOrder.orderNumber, selectedOrder._id)}</p>
                  <p className="text-sm text-gray-600 mt-2">Order Date</p>
                  <p className="text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-2">Status</p>
                  <StatusBadge status={selectedOrder.status} type="order" />
                  {formatReturnReason(selectedOrder) && (
                    <p className="text-sm text-amber-900 mt-2">{formatReturnReason(selectedOrder)}</p>
                  )}
                </div>

                {/* Customer Info */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                  <p className="text-sm text-gray-900"><strong className="text-gray-700">Name:</strong> {selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-900"><strong className="text-gray-700">Phone:</strong> {selectedOrder.phoneNumber}</p>
                </div>

                {/* Address */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Address</h4>
                  <p className="text-sm text-gray-900">
                    {selectedOrder.address.line1}<br />
                    {selectedOrder.address.area && `${selectedOrder.address.area}, `}
                    {selectedOrder.address.city}, {selectedOrder.address.province}<br />
                    {selectedOrder.address.postalCode}
                  </p>
                </div>

                {/* Items */}
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm gap-3">
                        <span className="text-gray-900 min-w-0">
                          {item.name} x {item.quantity}
                          {Number((item as any).discount || 0) > 0 && (
                            <span className="block text-xs text-green-600">
                              {Number((item as any).discount)}% off (-{formatMoney(Number((item as any).discountAmount || 0))})
                            </span>
                          )}
                        </span>
                        <span className="text-gray-900 font-medium shrink-0">
                          {formatMoney(Number((item as any).lineTotalAfterDiscount ?? item.price * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & Total */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-gray-900">{formatMoney(Number(selectedOrder.subtotal || 0))}</span>
                  </div>
                  {Number(selectedOrder.productDiscount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Product Discount:</span>
                      <span>-{formatMoney(Number(selectedOrder.productDiscount || 0))}</span>
                    </div>
                  )}
                  {Number(selectedOrder.deliveryFee || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Delivery Fee:</span>
                      <span className="text-gray-900">{formatMoney(Number(selectedOrder.deliveryFee || 0))}</span>
                    </div>
                  )}
                  {selectedOrder.couponCode && (
                    <div className="flex justify-between text-sm text-green-600 font-semibold">
                      <span>Coupon ({selectedOrder.couponCode}):</span>
                      <span>-{formatMoney(Number(selectedOrder.couponDiscount || 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Payment Type:</span>
                    <span className="text-gray-900 font-medium">{getPaymentType(selectedOrder)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-700">Payment Status:</span>
                    <StatusBadge status={selectedOrder.paymentStatus || "Pending"} type="payment" />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{formatMoney(selectedOrder.bill)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wishlist Tab Component
function WishlistTab({ wishlist, onUpdate }: { wishlist: any[]; onUpdate: () => void }) {
  return (
    <div>
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>My Wishlist</h2>
      {wishlist.length === 0 ? (
        <p className="text-gray-600">Your wishlist is empty</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {wishlist.map((product: any) => {
            // Backend returns products directly, but handle both cases for safety
            const productData = product?.productId || product;
            if (!productData || !productData._id) {
              console.warn("Invalid product in wishlist:", product);
              return null;
            }
            
            const productImage = productData.image1 || productData.image2 || productData.image3 || productData.image4 || productData.image5 || productData.image6 || productData.image || "/product.png";
            const discount = productData.discount || 0;

            return (
              <ProductCard
                key={productData._id}
                id={productData._id}
                name={productData.name}
                price={productData.price}
                image={productImage}
                offer={discount > 0 ? discount.toString() : undefined}
                isInWishlist={true}
                showHeartAlways={true}
                onRemove={onUpdate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Track Order Tab Component
const TRACK_STEPS = [
  "Pending",
  "Order Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Completed",
] as const;

function getTrackStepIndex(status?: string): number {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "Cancelled" || normalized === "Returned" || normalized === "Refunded") {
    return -1;
  }
  const idx = TRACK_STEPS.findIndex((step) => step === normalized);
  return idx >= 0 ? idx : 0;
}

function TrackOrderTab({ orders }: { orders: Order[] }) {
  const { formatMoney } = useStoreCurrency();
  const [query, setQuery] = useState("");
  const [searchedOrderNumber, setSearchedOrderNumber] = useState("");

  const selectedOrder = useMemo(() => {
    const searched = searchedOrderNumber.trim().replace(/^#/, "").toLowerCase();
    if (!searched) return null;

    return (
      orders.find((order) => {
        const fullId = String(order._id || "").toLowerCase();
        const displayNumber = formatOrderNumber(order.orderNumber, order._id)
          .replace(/^#/, "")
          .toLowerCase();

        return (
          displayNumber === searched ||
          String(order.orderNumber ?? "").toLowerCase() === searched ||
          fullId === searched ||
          fullId.slice(-8) === searched
        );
      }) || null
    );
  }, [orders, searchedOrderNumber]);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedOrderNumber(query.trim());
  };

  const openGlobalTrackPage = () => {
    const cleaned = query.trim().replace(/^#/, "");
    const url = cleaned
      ? `/track-order?id=${encodeURIComponent(cleaned)}`
      : "/track-order";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const stepIndex = selectedOrder ? getTrackStepIndex(selectedOrder.status) : -1;
  const terminalStatus = selectedOrder
    ? ["Cancelled", "Returned", "Refunded"].includes(String(normalizeOrderStatus(selectedOrder.status)))
    : false;

  return (
    <div>
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>Track Order</h2>
      <p className="text-sm text-gray-600 mb-4">
        Search by order number to see live status and delivery progress.
      </p>

      <div className="mb-4">
        <button
          type="button"
          onClick={openGlobalTrackPage}
          className="theme-button h-10 px-6 rounded-md inline-flex items-center gap-2"
        >
          <Truck size={16} />
          Track your Order
        </button>
        {/* <p className="text-xs text-gray-500 mt-2">
          Opens a public tracking page — anyone can look up an order by ID.
        </p> */}
      </div>

      {/* <form onSubmit={handleTrackOrder} className="mb-4 flex flex-col sm:flex-row gap-2 max-w-xl">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (searchedOrderNumber) setSearchedOrderNumber("");
          }}
          placeholder="Enter order number..."
          className="flex-1"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="theme-button h-10 px-6 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Track Order
        </button>
      </form> */}

      {searchedOrderNumber && !selectedOrder ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 max-w-xl">
          <p className="font-medium text-red-700">Order not found</p>
          <p className="text-sm text-red-600 mt-1">
            Please check the order number and try again.
          </p>
        </div>
      ) : selectedOrder ? (
        <div className={`${PROFILE_INNER_CARD} max-w-2xl`}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatOrderNumber(selectedOrder.orderNumber, selectedOrder._id)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Total: {formatMoney(selectedOrder.bill)}
                  </p>
                </div>
                <StatusBadge status={selectedOrder.status} type="order" />
              </div>

              {terminalStatus ? (
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-800">
                    This order is marked as{" "}
                    <strong>{normalizeOrderStatus(selectedOrder.status)}</strong>.
                    Tracking steps are closed for this status.
                  </p>
                </div>
              ) : (
                <ol className="space-y-0">
                  {TRACK_STEPS.map((step, index) => {
                    const done = index <= stepIndex;
                    const current = index === stepIndex;
                    return (
                      <li key={step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                              done ? "text-white border-transparent" : "bg-white text-gray-400 border-gray-300"
                            }`}
                            style={done ? { backgroundColor: "var(--theme-primary)" } : {}}
                          >
                            {done ? <Check size={16} /> : <span className="text-xs">{index + 1}</span>}
                          </div>
                          {index < TRACK_STEPS.length - 1 && (
                            <div
                              className={`w-0.5 flex-1 min-h-6 ${done && index < stepIndex ? "" : "bg-gray-200"}`}
                              style={
                                done && index < stepIndex
                                  ? { backgroundColor: "var(--theme-primary)" }
                                  : undefined
                              }
                            />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm font-medium ${current ? "text-gray-900" : "text-gray-700"}`}>
                            {step}
                          </p>
                          {current && (
                            <p className="text-xs text-gray-500 mt-0.5">Current status</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {/* Enter your order number above to view its tracking details. */}
        </p>
      )}
    </div>
  );
}

// User Report Tab Component
function UserReportTab() {
  const { success, error } = useToast();
  const { user: authUser } = useAuth();
  const [formData, setFormData] = useState({
    email: authUser?.email || "",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser?.email) {
      setFormData((prev) => ({ ...prev, email: authUser.email || prev.email }));
    }
  }, [authUser?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.subject || !formData.description) {
      error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await createQuery({
        email: formData.email,
        subject: `[Report] ${formData.subject.trim()}`,
        description: formData.description.trim(),
        name: authUser?.name || "",
        source: "profile",
      });
      success("Your report has been submitted. Our team will review it shortly.");
      setFormData({
        email: authUser?.email || "",
        subject: "",
        description: "",
      });
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>Report</h2>
      <p className="text-sm text-gray-600 mb-4">
        Report a problem with the website, an order, or your account.
      </p>

      <div className="border rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
          {/* <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter here"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--theme-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
              required
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Report Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="What is the issue about?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--theme-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue in detail..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none text-gray-900"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--theme-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 h-12 theme-button rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Queries Tab Component
function QueriesTab() {
  const { success, error } = useToast();
  const { user: authUser } = useAuth();
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [formData, setFormData] = useState({
    email: authUser?.email || "",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const loadQueries = useCallback(async () => {
    setLoadingQueries(true);
    try {
      const data = await getMyQueries();
      setQueries(Array.isArray(data) ? data : []);
    } catch {
      setQueries([]);
    } finally {
      setLoadingQueries(false);
    }
  }, []);

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    if (authUser?.email) {
      setFormData((prev) => ({ ...prev, email: authUser.email || prev.email }));
    }
  }, [authUser?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.subject || !formData.description) {
      error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await createQuery({
        ...formData,
        name: authUser?.name || "",
        source: "profile",
      });
      success("Your query has been submitted successfully!");
      setFormData({ 
        email: authUser?.email || "", 
        subject: "", 
        description: "" 
      });
      await loadQueries();
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to submit query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>Support & Help</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">My Messages</h3>
        {loadingQueries ? (
          <p className="text-gray-600 text-sm">Loading your messages...</p>
        ) : queries.length === 0 ? (
          <p className="text-gray-600 text-sm">
            No messages yet. Submit a query below or use the website contact form — replies will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {queries.map((query) => (
              <div key={query._id} className={PROFILE_INNER_CARD}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{query.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(query.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={query.status} type="query" />
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">You</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{query.description}</p>
                  </div>

                  {query.adminReply ? (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                        Support Team Reply
                      </p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{query.adminReply}</p>
                      {query.repliedAt && (
                        <p className="text-xs text-green-700 mt-2">
                          {new Date(query.repliedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : query.status === "Pending" ? (
                    <p className="text-sm text-amber-700">Waiting for support team reply...</p>
                  ) : query.status === "Read" ? (
                    <p className="text-sm text-blue-700">Your message has been read. Reply coming soon.</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
            <h3 className="font-semibold mb-2 text-gray-900">Send New Message</h3>
            <p className="text-gray-700 mb-4">Contact our support team for assistance with your orders or account.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 sm:pt-0">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter here"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none text-gray-900"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 h-12 theme-button rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ orders }: { orders: Order[] }) {
  const { success, error } = useToast();
  const { user: authUser } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ name: string; orderId: string; productId?: string } | null>(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  /** Keys: `${orderId}::${productId|productName}` for products already reviewed */
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());

  // Only show products from completed orders
  const completedOrders = orders.filter((o) =>
    o.status === "Complete" || o.status === "Completed" || o.status === "Delivered"
  );

  const makeReviewKey = (orderId: string, productId?: string, productName?: string) => {
    if (productId) return `${orderId}::id:${productId}`;
    return `${orderId}::name:${(productName || "").trim().toLowerCase()}`;
  };

  const isItemReviewed = (orderId: string, item: { name: string; productId?: string; id?: string }) => {
    const productId = item.productId || item.id;
    if (productId && reviewedKeys.has(makeReviewKey(orderId, String(productId)))) return true;
    if (reviewedKeys.has(makeReviewKey(orderId, undefined, item.name))) return true;
    return false;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reviews = await getUserReviews();
        if (cancelled) return;
        const keys = new Set<string>();
        (Array.isArray(reviews) ? reviews : []).forEach((r: any) => {
          if (r.type === "store") return;
          const orderId = r.orderId ? String(r.orderId) : "";
          if (!orderId) return;
          const productId =
            typeof r.productId === "object" && r.productId?._id
              ? String(r.productId._id)
              : r.productId
                ? String(r.productId)
                : undefined;
          if (productId) keys.add(makeReviewKey(orderId, productId));
          if (r.productName) keys.add(makeReviewKey(orderId, undefined, r.productName));
        });
        setReviewedKeys(keys);
      } catch {
        /* ignore — button stays visible until reviews load fails */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  
  const handleWriteReview = (item: { name: string; quantity: number; price: number }, orderId: string) => {
    // Try to find product ID from the item (if available)
    setSelectedProduct({
      name: item.name,
      orderId: orderId,
      productId: (item as any).productId || (item as any).id || undefined,
    });
    setShowReviewModal(true);
    setReviewData({ rating: 0, comment: "" });
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct) return;

    if (!authUser) {
      error("Please login to submit a review");
      return;
    }

    if (reviewData.rating === 0) {
      error("Please select a rating");
      return;
    }

    if (!reviewData.comment.trim()) {
      error("Please write a review comment");
      return;
    }

    setSubmitting(true);
    try {
      // Verify token exists
      const token = localStorage.getItem("token");
      if (!token) {
        error("Please login to submit a review");
        setSubmitting(false);
        return;
      }

      // If productId is not available, search for it by product name
      let productId: string | undefined = selectedProduct.productId;
      if (!productId) {
        const products = await getProducts({ activeOnly: true });
        const product = products.find((p: any) => p.name === selectedProduct.name);
        if (!product) {
          error("Product not found. Please contact support.");
          setSubmitting(false);
          return;
        }
        productId = product._id;
      }

      if (!productId) {
        error("Product ID is required. Please contact support.");
        setSubmitting(false);
        return;
      }

      await createReview({
        productId: productId,
        productName: selectedProduct.name,
        orderId: selectedProduct.orderId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      success("Review submitted successfully!");
      playCustomerSuccessSound();
      setReviewedKeys((prev) => {
        const next = new Set(prev);
        next.add(makeReviewKey(selectedProduct.orderId, productId));
        next.add(makeReviewKey(selectedProduct.orderId, undefined, selectedProduct.name));
        return next;
      });
      setShowReviewModal(false);
      setReviewData({ rating: 0, comment: "" });
      setSelectedProduct(null);
    } catch (err: any) {
      console.error("Review submission error:", err);
      if (err?.response?.status === 401) {
        error("Please login to submit a review. Your session may have expired.");
      } else {
        error(err?.response?.data?.message || err.message || "Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className={`${PROFILE_TITLE} ${spacing.inner.gapBottom}`}>My Reviews</h2>
      {completedOrders.length === 0 ? (
        <p className="text-gray-600">You haven't completed any orders yet. Reviews are available after order completion.</p>
      ) : (
        <div className="space-y-4">
          {completedOrders.map((order) => (
            <div key={order._id} className={PROFILE_INNER_CARD}>
              <p className="font-semibold mb-2 text-gray-900">Order {formatOrderNumber(order.orderNumber, order._id)}</p>
              <div className="space-y-3">
                {order.items.map((item, idx) => {
                  const alreadyReviewed = isItemReviewed(order._id, item as any);
                  return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b pb-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 break-words">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {alreadyReviewed && (
                        <p className="text-xs text-green-700 mt-1">Review submitted</p>
                      )}
                    </div>
                    {!alreadyReviewed && (
                      <button
                        onClick={() => handleWriteReview(item, order._id)}
                        className="px-4 h-11 sm:h-12 theme-button rounded-lg text-sm w-full sm:w-auto shrink-0"
                      >
                        Write Review
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-center gap-3 mb-4">
              <h3 className="text-xl sm:text-2xl font-bold theme-heading">Write Review</h3>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedProduct(null);
                  setReviewData({ rating: 0, comment: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-900 font-medium mb-2">Product: {selectedProduct.name}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={star <= reviewData.rating ? "fill-(--theme-primary) text-(--theme-primary)" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Your Review</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                placeholder="Share your experience with this product..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--theme-primary) focus:border-(--theme-primary) text-gray-900 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedProduct(null);
                  setReviewData({ rating: 0, comment: "" });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="flex-1 px-4 h-12 theme-button rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

