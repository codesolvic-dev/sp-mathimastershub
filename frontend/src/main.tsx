import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { ThemeProvider as LightDarkThemeProvider } from "./lib/ThemeProvider";
import { ThemeProvider as BrandThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "@/components/products/CartContext";
import "./index.css";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/ui/toast";
import ScrollToTop from "./components/ScrollToTop";
import { bootstrapCompanyBranding } from "./utils/companyBrand";
import { bootstrapMetaPixel } from "./utils/bootstrapMetaPixel";

// Apply company tab title/favicon ASAP (uses cache if present, else API — no Splorem flash)
bootstrapCompanyBranding();
// Meta Pixel ASAP so Pixel Helper / fbevents see the tag on first paint
bootstrapMetaPixel();

// Suppress console warnings from third-party libraries in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    // Filter out known third-party library warnings
    if (
      message.includes('minWidth') ||
      message.includes('allowOverflow') ||
      message.includes('button') && message.includes('non-boolean') ||
      message.includes('non-boolean attribute') ||
      message.includes('unknown prop') ||
      message.includes('styled-components') ||
      message.includes('recharts') ||
      message.includes('Stripe.js integration over HTTP') ||
      message.includes('React does not recognize') ||
      message.includes('Received `true` for a non-boolean')
    ) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(a => String(a)).join(' ');
    // Filter out known third-party library errors that are actually warnings
    if (
      message.includes('minWidth') ||
      message.includes('allowOverflow') ||
      message.includes('button') && message.includes('non-boolean') ||
      message.includes('non-boolean attribute') ||
      message.includes('unknown prop') ||
      message.includes('React does not recognize') ||
      message.includes('Received `true` for a non-boolean') ||
      message.includes('401') ||
      message.includes('Unauthorized') ||
      fullMessage.includes('401') ||
      fullMessage.includes('Unauthorized') ||
      fullMessage.includes('/user/wishlist') ||
      fullMessage.includes('/user/profile') ||
      fullMessage.includes('/user/addresses') ||
      fullMessage.includes('/user/orders') ||
      message.includes('Failed to load') && (message.includes('wishlist') || message.includes('profile') || message.includes('addresses') || message.includes('orders'))
    ) {
      return; // Suppress these errors
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <LightDarkThemeProvider>
        <BrandThemeProvider>
          <CartProvider>
            <AuthProvider>
              <ToastProvider>
                <BrowserRouter>
                <ScrollToTop />
                  <App />
              </BrowserRouter>
              </ToastProvider>
            </AuthProvider>
          </CartProvider>
        </BrandThemeProvider>
      </LightDarkThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);
