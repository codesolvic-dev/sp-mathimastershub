import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { incrementWebsiteVisit } from "@/api/analytics.api";

const SESSION_KEY = "site_visit_counted";

/** Count one website visitor per browser session on public storefront routes. */
export default function SiteVisitorTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/developer") || pathname.startsWith("/login")) {
      return;
    }
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    incrementWebsiteVisit().catch(() => {});
  }, [pathname]);

  return null;
}
