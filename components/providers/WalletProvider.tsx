"use client";

import React, { createContext } from "react";

import { useStellarWallet } from "@/hooks/useStellarWallet";

interface WalletContextType {
  publicKey: string | null;
  token: string | null;
  jwt: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  status: "loading" | "connected" | "disconnected" | "not-installed" | "error";
  connect: () => Promise<boolean>;
  disconnect: () => void;
  signTransaction: (xdr: string, network?: string) => Promise<string>;
  isLoading: boolean;
  walletReady: boolean;
  error: string | null;
}

/**
 * Internal wallet context. Not meant to be consumed directly outside this
 * module — components should use {@link useWallet} from `@/hooks/useWallet`,
 * which is the single supported entry point for wallet state and actions.
 */
export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useStellarWallet();

  const status: WalletContextType["status"] = wallet.isLoading
    ? "loading"
    : wallet.publicKey
      ? "connected"
      : !wallet.isInstalled
        ? "not-installed"
        : wallet.error
          ? "error"
          : "disconnected";

  return (
    <WalletContext.Provider
      value={{
        publicKey: wallet.publicKey,
        token: wallet.token,
        jwt: wallet.token,
        isConnected: !!wallet.publicKey,
        isInstalled: wallet.isInstalled,
        status,
        connect: wallet.connect,
        disconnect: wallet.disconnect,
        signTransaction: wallet.signTransaction,
        isLoading: wallet.isLoading,
        walletReady: wallet.walletReady,
        error: wallet.error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
