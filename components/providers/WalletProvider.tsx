"use client";

import React, { createContext, useContext } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";

type WalletStatus = "loading" | "connected" | "disconnected" | "not-installed" | "error";

interface WalletContextType {
  publicKey: string | null;
  token: string | null;
  jwt: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  status: WalletStatus;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  signTransaction: (xdr: string, network?: string) => Promise<string>;
  isLoading: boolean;
  walletReady: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const {
    publicKey,
    token,
    isInstalled,
    isLoading,
    walletReady,
    error,
    connect,
    disconnect,
    signTransaction,
  } = useStellarWallet();

  const jwt = token;

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        token,
        jwt,
        isConnected: !!publicKey,
        isInstalled,
        status: isLoading
          ? "loading"
          : !!publicKey
            ? "connected"
            : !isInstalled
              ? "not-installed"
              : error
                ? "error"
                : "disconnected",
        connect,
        disconnect,
        signTransaction,
        isLoading,
        walletReady,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
