import React, { Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LandingRoute from "./pages/shop/LandingRoute";
import ProjectDetail from "./pages/shop/ProjectDetail";
import ServiceDetail from "./pages/shop/ServiceDetail";
import CourseDetail from "./pages/shop/CourseDetail";
import { LoaderProvider } from "./context/LoaderContext";
import { ProductCardStyleProvider } from "./context/ProductCardStyleContext";
import { BlogCardStyleProvider } from "./context/BlogCardStyleContext";
import { ProductDetailStyleProvider } from "./context/ProductDetailStyleContext";
import { StoreCurrencyProvider } from "./contexts/StoreCurrencyContext";
import PageLoader from "./components/ui/PageLoader";
import SiteFloatingWhatsApp from "./components/layout/SiteFloatingWhatsApp";
import WelcomePopup from "./components/layout/WelcomePopup";
import SiteVisitorTracker from "./components/analytics/SiteVisitorTracker";
import MetaPixelTracker from "./components/analytics/MetaPixelTracker";
import GoogleSiteVerificationInjector from "./components/analytics/GoogleSiteVerificationInjector";

const Shop = React.lazy(() => import("./pages/shop/Shop"));
const ProductDetail = React.lazy(() => import("./pages/shop/ProductDetail"));
const CartPage = React.lazy(() => import("./pages/shop/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/shop/CheckoutPage"));
const OrderThankYouPage = React.lazy(() => import("./pages/shop/OrderThankYouPage"));
const TrackOrderPage = React.lazy(() => import("./pages/shop/TrackOrderPage"));

import Login from "./pages/auth/Login";
import CloudflareError521Page from "./pages/errors/CloudflareError521Page";
import AuthShell from "./pages/auth/AuthShell";
import AuthPageLayout from "./pages/auth/AuthPageLayout";
const Access = React.lazy(() => import("./pages/auth/Access"));
const Forgot = React.lazy(() => import("./pages/auth/Forgot"));
const ResetPasswordConfirm = React.lazy(() => import("./pages/auth/ResetPasswordConfirm"));
import AdminRoute from "./components/AdminRoute";
import { Navigate } from "react-router-dom";
import { CACHE_KEYS, getCachedData } from "./utils/cache";
import { applyCompanyBranding } from "./utils/companyBrand";
import { fetchCompanyShared } from "./utils/companyFetch";
import MaintenanceGate from "./components/maintenance/MaintenanceGate";
const AdminLayout = React.lazy(() => import("./pages/admin/layout/Adminlayout"));
const AdminProducts = React.lazy(() => import("./pages/admin/pages/ProductPage"));
const AdminSettings = React.lazy(() => import("./pages/admin/pages/SettingsPage"));
const AdminAssets = React.lazy(() => import("./pages/admin/pages/AssetsPage"));
const AdminDashboard = React.lazy(() => import("./pages/admin/pages/DashboardPage"));
const AdminOrders = React.lazy(() => import("./pages/admin/pages/OrdersPage"));
const AdminQueries = React.lazy(() => import("./pages/admin/pages/QueriesPage"));
const AdminReviews = React.lazy(() => import("./pages/admin/pages/ReviewsPage"));
const AdminBlogs = React.lazy(() => import("./pages/admin/pages/BlogPage"));
const CatalogPage = React.lazy(() => import("./pages/admin/pages/CatalogPage"));
const ApplicationsPage = React.lazy(() => import("./pages/admin/pages/ApplicationsPage"));
const SpConsolePage = React.lazy(() => import("./pages/admin/pages/SpConsolePage"));
const AdminSectionsPage = React.lazy(() => import("./pages/admin/pages/AdminSectionsPage"));
const AdminCategories = React.lazy(() => import("./pages/admin/pages/CategoriesPage"));
const AdminCoupons = React.lazy(() => import("./pages/admin/pages/CouponsPage"));
const AdminInventory = React.lazy(() => import("./pages/admin/pages/InventoryPage"));
const AdminMediaLibrary = React.lazy(() => import("./pages/admin/pages/MediaLibraryPage"));
const OperatorsPage = React.lazy(() => import("./pages/admin/pages/OperatorsPage"));
const AdminsPage = React.lazy(() => import("./pages/admin/pages/AdminsPage"));

const AdminNoPrivilegePage = React.lazy(() => import("./pages/admin/pages/AdminNoPrivilegePage"));
const DeveloperLayout = React.lazy(() => import("./pages/developer/layout/DeveloperLayout"));
const AdminTabsPage = React.lazy(() => import("./pages/developer/pages/AdminTabsPage"));
const CompanyPage = React.lazy(() => import("./pages/developer/pages/CompanyPage"));
const WebPagesPage = React.lazy(() => import("./pages/developer/pages/WebPagesPage"));
const ProfilePagesPage = React.lazy(() => import("./pages/developer/pages/ProfilePagesPage"));
const FooterPage = React.lazy(() => import("./pages/developer/pages/FooterPage"));
const HeaderPage = React.lazy(() => import("./pages/developer/pages/HeaderPage"));
const SpComponentsPage = React.lazy(() => import("./pages/developer/pages/SpComponentsPage"));
const CatalogTypesPage = React.lazy(() => import("./pages/developer/pages/CatalogTypesPage"));
const LandingSectionsPage = React.lazy(() => import("./pages/developer/pages/LandingSectionsPage"));
const SpFolioPage = React.lazy(() => import("./pages/developer/pages/SpFolioPage"));
const SpEcomPage = React.lazy(() => import("./pages/developer/pages/SpEcomPage"));
const ThirdPartyServicesPage = React.lazy(() => import("./pages/developer/pages/ThirdPartyServicesPage"));
const MetaPixelPage = React.lazy(() => import("./pages/developer/pages/MetaPixelPage"));
const GoogleSearchConsolePage = React.lazy(
  () => import("./pages/developer/pages/GoogleSearchConsolePage")
);
const SpEcomBuilderPage = React.lazy(() => import("./pages/developer/pages/SpEcomBuilderPage"));
const SpEcomSubPageView = React.lazy(() => import("./pages/developer/pages/SpEcomSubPageView"));
const LoaderSettingsPage = React.lazy(() => import("./pages/developer/pages/LoaderSettingsPage"));
const ControlPanelPage = React.lazy(() => import("./pages/developer/pages/ControlPanelPage"));
const PortfolioPage = React.lazy(() => import("@/components/landing/PortfolioPage"));
const BlogPage = React.lazy(() => import("@/components/landing/BlogPage"));
const Blogs = React.lazy(() => import("@/pages/shop/Blogs"));
const BlogDetail = React.lazy(() => import("@/pages/shop/BlogDetail"));
const FAQs = React.lazy(() => import("@/pages/shop/FAQs"));
const ContactUs = React.lazy(() => import("@/pages/shop/ContactUs"));
const AboutUs = React.lazy(() => import("@/pages/shop/AboutUs"));
const PrivacyPolicy = React.lazy(() => import("@/pages/shop/PrivacyPolicy"));
const TermsConditions = React.lazy(() => import("@/pages/shop/TermsConditions"));
const RefundPolicy = React.lazy(() => import("@/pages/shop/RefundPolicy"));
const ShippingPolicy = React.lazy(() => import("@/pages/shop/ShippingPolicy"));
const ReturnPolicy = React.lazy(() => import("@/pages/shop/ReturnPolicy"));
const DynamicPolicyPage = React.lazy(() => import("@/pages/shop/DynamicPolicyPage"));
const ReviewsPage = React.lazy(() => import("@/pages/shop/ReviewsPage"));
const CatalogDetail = React.lazy(() => import("@/pages/shop/CatalogDetail"));
const ApplicationsListPage = React.lazy(() => import("@/pages/shop/ApplicationsListPage"));
const GetStartedPage = React.lazy(() => import("@/pages/shop/GetStartedPage"));
const UserProfile = React.lazy(() => import("./pages/user/UserProfile"));

export default function App() {
  useEffect(() => {
    // Only apply cached company branding — never flash hardcoded "Splorem"
    const cachedCompany = getCachedData<{ company?: string; logo?: string; favicon?: string }>(
      CACHE_KEYS.COMPANY
    );
    if (cachedCompany && (cachedCompany.company || cachedCompany.favicon || cachedCompany.logo)) {
      applyCompanyBranding(cachedCompany);
    }

    const loadCompanyBranding = async () => {
      try {
        const company = await fetchCompanyShared();
        applyCompanyBranding(getCachedData(CACHE_KEYS.COMPANY) || company);
      } catch {
        // Keep current title/favicon (index.html or last applied company) — no Splorem fallback
      }
    };
    loadCompanyBranding();
  }, []);

  return (
      <LoaderProvider>
      <ProductCardStyleProvider>
      <BlogCardStyleProvider>
      <ProductDetailStyleProvider>
      <StoreCurrencyProvider>
      <SiteVisitorTracker />
      <GoogleSiteVerificationInjector />
      <MetaPixelTracker />
      <WelcomePopup />
      <Suspense fallback={<PageLoader />}>
      <MaintenanceGate>
      <Routes>
        {/* Home landing chosen in Developer → Company */}
        <Route path="/" element={<LandingRoute mode="home" />} />
        <Route path="/store" element={<LandingRoute mode="alternate" />} />
        {/* /shop = full shop with category filtering, /cart = cart page */}
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/thank-you/:orderId" element={<OrderThankYouPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/portfoliopage" element={<PortfolioPage />} />
        <Route path="/blogpage" element={<BlogPage />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/policy/:type" element={<DynamicPolicyPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/service/:id" element={<ServiceDetail />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/catalog/:type/:id" element={<CatalogDetail />} />
        <Route path="/applications" element={<ApplicationsListPage />} />
        <Route path="/zi-core-package" element={<GetStartedPage />} />
        <Route path="/get-started" element={<Navigate to="/zi-core-package" replace />} />
        <Route
          path="/reset-password/:token"
          element={
            <AuthPageLayout>
              <ResetPasswordConfirm />
            </AuthPageLayout>
          }
        />
        <Route element={<AuthShell />}>
          <Route path="/login" element={<Login />} />
          <Route path="/access" element={<Access />} />
          <Route path="/forgot" element={<Forgot />} />
        </Route>
        <Route path="/error/521" element={<CloudflareError521Page />} />
        <Route path="/profile" element={<UserProfile />} />

        {/* ---------- ADMIN ROUTES ---------- */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="coupons" element={<AdminCoupons />} />

          <Route path="assets" element={<AdminAssets />} />
          <Route path="media" element={<AdminMediaLibrary />} />
          <Route path="queries" element={<AdminQueries />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="blogs" element={<Navigate to="/admin/catalog/blog" replace />} />
          <Route path="catalog" element={<Navigate to="/admin/catalog/blog" replace />} />
          <Route path="catalog/:type" element={<CatalogPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="control-panel" element={<ControlPanelPage />} />
          <Route path="sections" element={<Navigate to="/developer/sections" replace />} />
          <Route path="operators" element={<OperatorsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="no-access" element={<AdminNoPrivilegePage />} />
          <Route path="sp-console" element={<SpConsolePage />} />
        </Route>

        {/* ---------- DEVELOPER ROUTES ---------- */}
        <Route path="/developer" element={<AdminRoute><DeveloperLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/developer/control-panel" replace />} />
          <Route path="admin-tabs" element={<AdminTabsPage />} />
          <Route path="catalog-types" element={<CatalogTypesPage />} />
          <Route path="landing-sections" element={<LandingSectionsPage />} />
          <Route path="spfolio" element={<SpFolioPage />} />
          <Route path="sp-ecom" element={<SpEcomPage />} />
          <Route path="third-party-services" element={<ThirdPartyServicesPage />} />
          <Route path="third-party-services/meta-pixel" element={<MetaPixelPage />} />
          <Route
            path="third-party-services/google-search-console"
            element={<GoogleSearchConsolePage />}
          />
          <Route
            path="meta-pixel"
            element={<Navigate to="/developer/third-party-services/meta-pixel" replace />}
          />
          <Route path="sp-ecom/:slug/builder" element={<SpEcomBuilderPage />} />
          <Route path="sp-ecom/:slug" element={<SpEcomSubPageView />} />
          <Route path="company" element={<CompanyPage />} />
          <Route path="header" element={<HeaderPage />} />
          <Route path="web-pages" element={<WebPagesPage />} />
          <Route path="profile-pages" element={<ProfilePagesPage />} />
          <Route path="footer" element={<FooterPage />} />
          <Route path="sections" element={<AdminSectionsPage />} />
          <Route path="sp-components" element={<SpComponentsPage />} />
          <Route path="loader-settings" element={<LoaderSettingsPage />} />
          <Route path="control-panel" element={<ControlPanelPage />} />
        </Route>

        <Route path="*" element={<LandingRoute mode="home" />} />
      </Routes>
      <SiteFloatingWhatsApp />
      </MaintenanceGate>
     </Suspense>
    </StoreCurrencyProvider>
    </ProductDetailStyleProvider>
    </BlogCardStyleProvider>
    </ProductCardStyleProvider>
    </LoaderProvider>
  );
}
