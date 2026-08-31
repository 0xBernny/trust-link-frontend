"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { generateSummaryPDF } from "@/lib/pdf";
import type { Escrow } from "@/types";

export interface TransactionHistoryExportProps {
  escrows: Escrow[];
  vendorId?: string;
}

export default function TransactionHistoryExport({
  escrows,
  vendorId = "vendor",
}: TransactionHistoryExportProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (escrows.length === 0) {
      toast.error(t("dashboard.pdfExport.noTransactions"));
      return;
    }

    try {
      setIsExporting(true);
      const filename = `trustlink-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
      await generateSummaryPDF(escrows, vendorId, filename);
      toast.success(t("dashboard.pdfExport.success"));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t("dashboard.pdfExport.error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting || escrows.length === 0}
      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      title={t("dashboard.pdfExport.title")}
    >
      <FileDown size={16} />
      {isExporting ? t("dashboard.pdfExport.exporting") : t("dashboard.pdfExport.button")}
    </button>
  );
}
