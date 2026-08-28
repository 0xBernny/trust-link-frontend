"use client";

import { useContext } from "react";

import { WalletContext } from "@/components/providers/WalletProvider";

/**
 * The single supported entry point for wallet state and actions.
 *
 * Provides access to the current Stellar / Freighter wallet session,
 * including the connected public key, JWT auth token, and helpers
 * to connect, disconnect, and sign transactions.
 *
 * **Must be rendered inside a `<WalletProvider>`** — throws if the
 * context is missing.
 *
 * @returns An object containing:
 *   - `publicKey`       – The connected Stellar public key, or `null`.
 *   - `token`           – JWT auth token obtained via challenge/response, or `null`.
 *   - `jwt`             – Alias for the current JWT, always available in memory.
 *   - `isConnected`     – `true` when a public key is present.
 *   - `isInstalled`     – `true` when the Freighter browser extension is detected.
 *   - `connect`         – Initiates the Freighter connection and authentication flow.
 *   - `disconnect`      – Clears the session and removes stored credentials.
 *   - `signTransaction` – Signs a Stellar XDR transaction via Freighter.
 *   - `isLoading`       – `true` while a connection or auth request is in flight.
 *   - `error`           – Human-readable error message, or `null`.
 *
 * @throws {Error} If called outside of a `<WalletProvider>`.
 *
 * @example
 * ```tsx
 * import useWallet from "@/hooks/useWallet";
 *
 * function ConnectButton() {
 *   const { isConnected, connect, disconnect, isLoading } = useWallet();
 *
 *   return (
 *     <button onClick={isConnected ? disconnect : connect} disabled={isLoading}>
 *       {isConnected ? "Disconnect" : "Connect Wallet"}
 *     </button>
 *   );
 * }
 * ```
 *
 * @see {@link WalletProvider} for the context provider that must wrap your component tree.
 */
export default function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
