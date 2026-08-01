import React, { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import PageLoader from "@/components/ui/PageLoader";

/** Single auth page with shared layout (login shell uses Outlet instead). */
export default function AuthPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </AuthLayout>
  );
}
