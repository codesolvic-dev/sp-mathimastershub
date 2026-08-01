import SpConsoleAdminsTable from "@/components/admin/spconsole/SpConsoleAdminsTable";

/** Admin Login Permission — manage admin / sub-admin accounts and active status. */
export default function AdminsPage() {
  return (
    <div className="w-full max-w-full min-w-0">
      <SpConsoleAdminsTable />
    </div>
  );
}
