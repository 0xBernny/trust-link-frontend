"use client";

import { jwtDecode } from "jwt-decode";
import { useCallback,useEffect, useState } from "react";
import { toast } from "sonner";

import { useNetwork } from "@/components/providers/NetworkProvider";
import { captureError, setLoggerUser } from "@/lib/logger";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import {
  connectFreighter,
  isConnected as freighterIsConnected,
  isFreighterInstalled,
  signTransaction as freighterSignTransaction,
} from "@/lib/stellar/freighter";

/** Lifecycle status of the wallet connection/authentication flow. */
export type WalletStatus = "loading" | "connected" | "disconnected" | "not-installed" | "error";

interface JwtPayload {
  exp: number;
  sub?: string;
  iat?: number;
}

const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey";
const TOKEN_STORAGE_KEY = "wallet.token";

/**
 * The state and actions returned by {@link useStellarWallet}.
 */
export interface StellarWalletState {
  /** The connected Stellar public key (`G...`), or `null` if no wallet is connected. */
  publicKey: string | null;
  /**
   * The current SEP-10 JWT session token, or `null` before authentication
   * completes. Persisted to `localStorage` and refreshed automatically a
   * few minutes before it expires.
   */
  token: string | null;
  /** `true` once the Freighter browser extension has been detected. */
  isInstalled: boolean;
  /**
   * `true` while the hook is restoring a previous session on mount, or
   * while {@link StellarWalletState.connect} is in flight.
   */
  isLoading: boolean;
  /**
   * `true` once the initial session-restore pass (on mount) has finished,
   * regardless of whether a wallet ended up connected. Useful for gating
   * UI that shouldn't render until the wallet hook has settled.
   */
  walletReady: boolean;
  /** Human-readable message from the most recent failed `connect()` call, or `null`. */
  error: string | null;
  /**
   * Prompts the user to connect Freighter, then runs the SEP-10
   * challenge/response flow to obtain a session JWT.
   *
   * On success, `publicKey` and `token` are populated and both are
   * persisted to `localStorage` so the session can be restored on the
   * next page load. On failure, `error` is set and a toast is shown.
   *
   * @returns A promise resolving to `true` if the wallet connected and
   *   authenticated successfully, or `false` if Freighter isn't installed
   *   or the connection was rejected/failed.
   */
  connect: () => Promise<boolean>;
  /**
   * Clears the in-memory wallet session (`publicKey`, `token`) and removes
   * the persisted public key and JWT from `localStorage`. Does not revoke
   * anything on the Freighter extension side — the user can reconnect the
   * same account at any time via {@link StellarWalletState.connect}.
   */
  disconnect: () => void;
  /**
   * Signs a Stellar transaction envelope (XDR) with the connected
   * Freighter wallet.
   *
   * @param xdr - The base64-encoded, unsigned transaction envelope to sign.
   * @param networkOverride - Optional Stellar network passphrase label
   *   (e.g. `"PUBLIC"` or `"TESTNET"`) to sign against, overriding the
   *   network currently selected via `NetworkProvider`. Most callers can
   *   omit this and rely on the ambient network.
   * @returns A promise resolving to the base64-encoded, signed transaction
   *   envelope, ready to submit to Horizon/Soroban RPC.
   * @throws Rethrows any error from Freighter (e.g. user rejected the
   *   signing request) after showing an error toast.
   */
  signTransaction: (xdr: string, networkOverride?: string) => Promise<string>;
}

/**
 * Internal implementation hook that owns the Freighter/SEP-10 session state
 * — connecting to Freighter, exchanging a signed SEP-10 challenge for a JWT,
 * persisting the session to `localStorage`, restoring it on mount, and
 * silently re-authenticating shortly before the JWT expires.
 *
 * It is consumed exclusively by {@link WalletProvider} — components should
 * use `useWallet` from `@/hooks/useWallet` instead of importing this
 * directly, since that hook enforces the provider boundary and is the
 * documented public entry point.
 *
 * @returns A {@link StellarWalletState} object with the current session
 *   state and the `connect` / `disconnect` / `signTransaction` actions.
 *
 * @example
 * ```tsx
 * // Inside WalletProvider only — components should use useWallet() instead.
 * function WalletProvider({ children }: { children: React.ReactNode }) {
 *   const wallet = useStellarWallet();
 *   return (
 *     <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
 *   );
 * }
 * ```
 */
export function useStellarWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { network } = useNetwork();

  const stellarNetworkLabel = network === "mainnet" ? "PUBLIC" : "TESTNET";

  const authenticate = useCallback(async (pubKey: string) => {
    try {
      const challengeXdr = await getChallenge(pubKey);
      const net = network === "mainnet" ? "PUBLIC" : "TESTNET";
      const signedXdr = await freighterSignTransaction(challengeXdr, net);
      const jwt = await verifyChallenge(signedXdr);
      setToken(jwt);
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
      }
      return jwt;
    } catch (err: unknown) {
      console.error("Authentication failed:", err);
      captureError(err, { scope: "auth", action: "authenticate" });
      toast.error("Authentication failed");
      throw err;
    }
  }, [network]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const installed = await isFreighterInstalled();
      if (!isMounted) return;
      setIsInstalled(installed);

      const storedPublicKey = typeof window !== "undefined" ? localStorage.getItem(PUBLIC_KEY_STORAGE_KEY) : null;
      if (storedPublicKey && installed) {
        try {
          const connected = await freighterIsConnected();
          if (!isMounted) return;
          if (connected) {
            setPublicKey(storedPublicKey);
            setLoggerUser(storedPublicKey);
            await authenticate(storedPublicKey);
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
          }
        } catch (e) {
          captureError(e, { scope: "wallet", action: "restoreSession" });
        }
      }
      if (!isMounted) return;
      setIsLoading(false);
      setWalletReady(true);
    }
    init();
    return () => { isMounted = false; };
  }, [authenticate]);

  /**
   * Prompts the user to connect Freighter, then runs the SEP-10
   * challenge/response flow to obtain a session JWT. See
   * {@link StellarWalletState.connect} for the full contract.
   */
  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        toast.error("Freighter is not installed");
        setError("Freighter is not installed");
        return false;
      }

      const pubKey = await connectFreighter();
      setPublicKey(pubKey);
      setLoggerUser(pubKey);
      if (typeof window !== "undefined") {
        localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, pubKey);
      }

      await authenticate(pubKey);

      toast.success("Wallet connected");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticate]);

  /**
   * Clears the wallet session and removes it from `localStorage`. See
   * {@link StellarWalletState.disconnect} for the full contract.
   */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    setLoggerUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    toast.success("Wallet disconnected");
  }, []);

  /**
   * Signs a Stellar transaction envelope (XDR) with the connected
   * Freighter wallet. Exposed on the hook's return value as
   * `signTransaction`. See {@link StellarWalletState.signTransaction} for
   * the full contract.
   *
   * @param xdr - The base64-encoded, unsigned transaction envelope to sign.
   * @param networkOverride - Optional network passphrase label (e.g.
   *   `"PUBLIC"` / `"TESTNET"`) overriding the ambient network.
   * @returns The base64-encoded, signed transaction envelope.
   * @throws Rethrows the underlying Freighter error (e.g. user rejection)
   *   after showing an error toast.
   */
  const signWalletTransaction = useCallback(async (xdr: string, networkOverride?: string) => {
    try {
      const net = networkOverride || stellarNetworkLabel;
      const signedXdr = await freighterSignTransaction(xdr, net);
      return signedXdr;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign transaction";
      toast.error(message);
      throw err;
    }
  }, [stellarNetworkLabel]);

  useEffect(() => {
    if (!token || !publicKey) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const timeLeft = expirationTime - now;

      if (timeLeft <= 0) {
        const id = setTimeout(() => authenticate(publicKey), 0);
        return () => clearTimeout(id);
      }

      const timeout = setTimeout(() => {
        authenticate(publicKey);
      }, Math.max(0, timeLeft - 300000));

      return () => clearTimeout(timeout);
    } catch (err) {
      captureError(err, { scope: "auth", action: "decodeSessionToken" });
      setTimeout(() => setToken(null), 0);
    }
  }, [token, publicKey, authenticate]);

  return {
    publicKey,
    token,
    isInstalled,
    isLoading,
    walletReady,
    error,
    connect,
    disconnect,
    signTransaction: signWalletTransaction,
  };
}