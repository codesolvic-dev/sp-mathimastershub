import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PageLoader from "./ui/PageLoader";

interface Props {
  children: React.ReactNode;
}

function pathAllowed(pathname: string, allowedTabs: string[]): boolean {
  return allowedTabs.some(
    (tabPath) => pathname === tabPath || pathname.startsWith(`${tabPath}/`)
  );
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const hasOperatorAccess = !!user?.adminAccess;

  if (!user || (!isAdmin && !hasOperatorAccess)) {
    return <Navigate to="/login" replace />;
  }

  const allowedTabs: string[] = Array.isArray(user?.adminTabAccess) ? user.adminTabAccess : [];
  const noAccessPath = "/admin/no-access";

  // Full admin with no tab list → unrestricted
  if (isAdmin && allowedTabs.length === 0) {
    if (location.pathname === noAccessPath) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // Restricted admin or operator
  if (allowedTabs.length === 0) {
    if (location.pathname !== noAccessPath) {
      return <Navigate to={noAccessPath} replace />;
    }
    return <>{children}</>;
  }

  if (location.pathname === noAccessPath) {
    return <Navigate to={allowedTabs[0]} replace />;
  }

  // Policies share Assets permission; catalog covers /admin/catalog/*
  const effectiveAllowed = [...allowedTabs];
  if (allowedTabs.includes("/admin/assets") && !allowedTabs.includes("/admin/policies")) {
    effectiveAllowed.push("/admin/policies");
  }
  if (
    (allowedTabs.includes("/admin/blogs") || allowedTabs.includes("/admin/catalog")) &&
    !allowedTabs.some((p) => p.startsWith("/admin/catalog"))
  ) {
    effectiveAllowed.push("/admin/catalog");
  }

  if (!pathAllowed(location.pathname, effectiveAllowed)) {
    // Allow nested catalog routes when blogging/catalog granted
    if (
      location.pathname.startsWith("/admin/catalog") &&
      (allowedTabs.includes("/admin/catalog") || allowedTabs.includes("/admin/blogs"))
    ) {
      return <>{children}</>;
    }
    return <Navigate to={allowedTabs[0]} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
