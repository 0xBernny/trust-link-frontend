import VendorDashboardList from "@/components/dashboard/VendorDashboardList";
import DashboardAnalyticsSummary from "@/components/dashboard/DashboardAnalyticsSummary";

export default function DashboardSection() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">Analytics Overview</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Escrow volume over the last 30 days.
          </p>
        </div>
        <DashboardAnalyticsSummary />
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">Your Escrows</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Manage and track all your active escrows.
          </p>
        </div>
        <VendorDashboardList />
      </div>
    </section>
  );
}
