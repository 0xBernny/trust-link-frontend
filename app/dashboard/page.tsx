import type { Metadata } from "next";
import { Suspense } from "react";

import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | TrustLink",
  description:
    "Manage your escrows, track shipments, and review your TrustLink dashboard.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardClient />
    </Suspense>
  );
}
