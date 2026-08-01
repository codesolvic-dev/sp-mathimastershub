import React from "react";
import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import PageLoader from "@/components/ui/PageLoader";

/** Keeps AuthLayout mounted across /login, /access, /forgot, etc. */
export default function AuthShell() {
  return (
    <AuthLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AuthLayout>
  );
}
