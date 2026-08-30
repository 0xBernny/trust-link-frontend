import type { Metadata } from "next";

import VendorProfileClient from "./VendorProfileClient";

export const metadata: Metadata = {
  title: "Vendor Profile | TrustLink",
  description:
    "View a vendor's rating, verification level, and transaction history on TrustLink.",
};

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <VendorProfileClient address={address} />;
}
