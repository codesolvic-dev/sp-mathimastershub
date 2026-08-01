import React, { useEffect, useMemo, useState } from "react";
import type { TableColumn } from "react-data-table-component";
import EnhancedDataTable from "@/pages/admin/components/table/EnhancedDataTable";
import { Input } from "@/components/ui/input";
import {
  getOperatorUsers,
  getOperatorUserById,
  updateOperatorPassword,
  updateOperatorUser,
  createAdminUser,
} from "@/api/operator.api";
import { getEnabledAdminTabs } from "@/api/admintab.api";
import { getEnabledCatalogTypes } from "@/api/catalogtype.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import { useAuth } from "@/hooks/useAuth";
import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";

type AdminTab = {
  _id: string;
  label: string;
  path: string;
};

type CatalogType = {
  _id: string;
  slug: string;
  label: string;
};

type AdminUser = {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  adminAccess: boolean;
  adminTabAccess: string[];
  lastLoginAt?: string | null;
  createdAt?: string | null;
};

const CATALOG_TAB_PATHS = new Set(["/admin/catalog", "/admin/blogs"]);

export default function SpConsoleAdminsTable() {
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tabs, setTabs] = useState<AdminTab[]>(() => {
    const cached = getCachedData<AdminTab[]>(CACHE_KEYS.ADMIN_TABS);
    return Array.isArray(cached) ? cached : [];
  });
  const [catalogTypes, setCatalogTypes] = useState<CatalogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    status: "active" as "active" | "inactive",
    adminTabAccess: [] as string[],
  });

  const currentId = String(currentUser?.id || currentUser?._id || "");
  const isFullAdmin = currentUser?.role?.toLowerCase() === "admin";
  const visibleTabs = tabs.filter((tab) => tab.path !== "/admin/sp-console");

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, tabsData, catalogData] = await Promise.all([
        getOperatorUsers("admin"),
        getEnabledAdminTabs(),
        getEnabledCatalogTypes().catch(() => []),
      ]);
      setUsers(
        Array.isArray(usersData)
          ? usersData.map((u: any) => ({
              ...u,
              id: u._id,
              status: u.status === "inactive" ? "inactive" : "active",
            }))
          : []
      );
      setTabs(Array.isArray(tabsData) ? tabsData : []);
      setCatalogTypes(Array.isArray(catalogData) ? catalogData : []);
      if (Array.isArray(tabsData)) setCachedData(CACHE_KEYS.ADMIN_TABS, tabsData);
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onToggleStatus = async (row: AdminUser) => {
    if (String(row._id) === currentId) {
      error("You cannot change your own account status");
      return;
    }
    const nextStatus = row.status === "active" ? "inactive" : "active";
    try {
      await updateOperatorUser(row._id, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === row._id ? { ...u, status: nextStatus } : u))
      );
      success(
        nextStatus === "active"
          ? "Admin activated"
          : "Admin deactivated — they cannot log in"
      );
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to update status");
    }
  };

  const onOpenEdit = async (row: AdminUser) => {
    try {
      const full = await getOperatorUserById(row._id);
      setSelectedUser({
        ...full,
        id: full._id,
        status: full.status === "inactive" ? "inactive" : "active",
      });
      setPassword("");
      setOpenModal(true);
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to load admin details");
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const columns: TableColumn<AdminUser>[] = useMemo(
    () => [
      { name: "Name", selector: (row) => row.name, sortable: true },
      { name: "Email", selector: (row) => row.email, sortable: true, grow: 1.5 },
      { name: "Role", selector: (row) => row.role, sortable: true },
      {
        name: "Last Login",
        selector: (row) =>
          row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "Never",
        sortable: true,
      },
      {
        name: "Status",
        cell: (row) => {
          const active = row.status !== "inactive";
          const isSelf = String(row._id) === currentId;
          return (
            <button
              type="button"
              title={isSelf ? "You cannot change your own status" : active ? "Active" : "Inactive"}
              disabled={isSelf}
              onClick={() => onToggleStatus(row)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                active ? "" : "bg-gray-300"
              }`}
              style={active ? { backgroundColor: "var(--theme-primary)" } : {}}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          );
        },
      },
    ],
    [users, currentId]
  );

  const saveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateOperatorUser(selectedUser._id, {
        name: selectedUser.name,
        email: selectedUser.email,
        status: selectedUser.status,
        adminAccess: selectedUser.adminAccess,
        adminTabAccess: selectedUser.adminTabAccess || [],
      });
      if (password.trim()) {
        await updateOperatorPassword(selectedUser._id, password.trim());
      }
      success("Admin updated successfully");
      setOpenModal(false);
      await loadData();
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to save admin");
    } finally {
      setSaving(false);
    }
  };

  const openAddAdmin = () => {
    setNewAdmin({
      name: "",
      email: "",
      password: "",
      status: "active",
      adminTabAccess: visibleTabs.map((t) => t.path),
    });
    setOpenAddModal(true);
  };

  const createAdmin = async () => {
    const name = newAdmin.name.trim();
    const email = newAdmin.email.trim();
    const pwd = newAdmin.password;
    if (!name || !email || !pwd) {
      error("Name, email, and password are required");
      return;
    }
    if (pwd.length < 6) {
      error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      await createAdminUser({
        name,
        email,
        password: pwd,
        status: newAdmin.status,
        adminTabAccess: newAdmin.adminTabAccess,
      });
      success("Admin created successfully");
      setOpenAddModal(false);
      await loadData();
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold theme-heading">Admin Login Permission</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage admin and sub-admin accounts. Set status to inactive to block login.
          </p>
        </div>
        {isFullAdmin && (
          <Button
            type="button"
            className="theme-button text-white shrink-0"
            onClick={openAddAdmin}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Admin
          </Button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden w-full max-w-full min-w-0">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <h3 className="text-lg font-semibold theme-heading">Admins</h3>
          <Input
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 text-gray-900"
          />
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <CircularLoader size={24} />
          </div>
        ) : (
          <EnhancedDataTable
            columns={columns}
            data={filteredUsers}
            onView={onOpenEdit}
            onEdit={onOpenEdit}
          />
        )}
      </div>

      {openModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Admin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-4">
              <PasswordInput
                label="Set New Password"
                placeholder="Leave empty to keep current password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
              />
            </div>

            <div className="mt-4 flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Account Status</p>
                <p className="text-xs text-gray-500">
                  Inactive accounts cannot log in
                </p>
              </div>
              <button
                type="button"
                disabled={String(selectedUser._id) === currentId}
                onClick={() =>
                  setSelectedUser({
                    ...selectedUser,
                    status: selectedUser.status === "active" ? "inactive" : "active",
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  selectedUser.status === "active" ? "" : "bg-gray-300"
                }`}
                style={
                  selectedUser.status === "active"
                    ? { backgroundColor: "var(--theme-primary)" }
                    : {}
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    selectedUser.status === "active" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Admin Sidebar Tab Access</h3>
              <p className="text-xs text-gray-500 mb-3">
                Choose which sidebar tabs this account can open. Changes apply after they log in again
                (or refresh).
              </p>
              <div className="space-y-2">
                {visibleTabs.map((tab) => {
                  const isCatalog = CATALOG_TAB_PATHS.has(tab.path);
                  const access = selectedUser.adminTabAccess || [];
                  const isAdminRole = selectedUser.role?.toLowerCase() === "admin";
                  const treatAsAllAccess = isAdminRole && access.length === 0;
                  const checked = treatAsAllAccess || access.includes(tab.path);

                  const toggleTab = () => {
                    let current = [...(selectedUser.adminTabAccess || [])];
                    if (treatAsAllAccess) {
                      current = visibleTabs.map((t) => t.path);
                    }
                    const next = new Set(current);
                    if (next.has(tab.path)) next.delete(tab.path);
                    else next.add(tab.path);
                    setSelectedUser({
                      ...selectedUser,
                      adminTabAccess: Array.from(next),
                    });
                  };

                  return (
                    <div key={tab._id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-2 border-b border-transparent bg-gray-50">
                        <div>
                          <p className="font-medium">{tab.label}</p>
                          <p className="text-xs text-gray-500">{tab.path}</p>
                        </div>
                        <button
                          type="button"
                          onClick={toggleTab}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            checked ? "" : "bg-gray-300"
                          }`}
                          style={checked ? { backgroundColor: "var(--theme-primary)" } : {}}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              checked ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                      {isCatalog && catalogTypes.length > 0 && (
                        <div className="border-t border-gray-100 bg-white px-3 py-2 space-y-1.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Catalog sub-menus
                          </p>
                          {catalogTypes.map((ct) => (
                            <div
                              key={ct._id}
                              className="flex items-center justify-between py-1.5 pl-2"
                            >
                              <div>
                                <p className="text-sm text-gray-800">{ct.label}</p>
                                <p className="text-xs text-gray-400">
                                  /admin/catalog/{ct.slug}
                                </p>
                              </div>
                              <span className="text-xs text-emerald-700">
                                {checked ? "Shown" : "Hidden"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg"
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-white rounded-lg disabled:opacity-60"
                style={{ backgroundColor: "var(--theme-primary)" }}
                onClick={saveUser}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">Add Admin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <PasswordInput
                label="Password"
                placeholder="At least 6 characters"
                value={newAdmin.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
              />
            </div>

            <div className="mt-4 flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Account Status</p>
                <p className="text-xs text-gray-500">Inactive accounts cannot log in</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNewAdmin({
                    ...newAdmin,
                    status: newAdmin.status === "active" ? "inactive" : "active",
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  newAdmin.status === "active" ? "" : "bg-gray-300"
                }`}
                style={
                  newAdmin.status === "active"
                    ? { backgroundColor: "var(--theme-primary)" }
                    : {}
                }
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    newAdmin.status === "active" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Admin Sidebar Tab Access</h3>
              <div className="space-y-2">
                {visibleTabs.map((tab) => {
                  const checked = newAdmin.adminTabAccess.includes(tab.path);
                  return (
                    <div
                      key={tab._id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{tab.label}</p>
                        <p className="text-xs text-gray-500">{tab.path}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = new Set(newAdmin.adminTabAccess);
                          if (next.has(tab.path)) next.delete(tab.path);
                          else next.add(tab.path);
                          setNewAdmin({
                            ...newAdmin,
                            adminTabAccess: Array.from(next),
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          checked ? "" : "bg-gray-300"
                        }`}
                        style={checked ? { backgroundColor: "var(--theme-primary)" } : {}}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            checked ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg"
                onClick={() => setOpenAddModal(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-white rounded-lg disabled:opacity-60"
                style={{ backgroundColor: "var(--theme-primary)" }}
                onClick={createAdmin}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
