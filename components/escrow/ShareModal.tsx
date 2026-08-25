"use client";

import { Copy, MessageCircle } from "lucide-react";
import React, { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCodeComponent from "@/components/ui/QRCodeComponent";
import { track } from "@/lib/analytics";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  escrowId: string;
}

export default function ShareModal({ isOpen, onClose, url, escrowId: _escrowId }: ShareModalProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("Link copied!");
      track("link_copied", { method: "share_modal" });
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (_err) {
      setCopyStatus("Failed to copy");
    }
  };

  const shareWhatsApp = async () => {
    const text = `Pay for your order securely using TrustLink: ${url}`;
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    track("link_shared", { platform: "whatsapp", method: "share_modal" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escrow Link Generated!</DialogTitle>
          <DialogDescription>
            Share this link with your buyer so they can securely pay.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center gap-6">
          <QRCodeComponent value={url} size={200} />

          <div className="w-full space-y-4">
            <div className="relative">
              <input
                readOnly
                value={url}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            {copyStatus && (
              <p className="text-center text-sm font-medium text-emerald-600">
                {copyStatus}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2.5 font-medium text-white transition hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
