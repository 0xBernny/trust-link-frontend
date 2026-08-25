import CryptoJS from 'crypto-js';

/**
 * Dispute Evidence Hashing Utility
 * Ensures dispute evidence hashing adheres to best practices.
 */

export function hashEvidence(evidence: string): string {
  // Use SHA-256 for secure hashing of dispute evidence
  return CryptoJS.SHA256(evidence).toString(CryptoJS.enc.Hex);
}

export function verifyEvidence(evidence: string, hash: string): boolean {
  return hashEvidence(evidence) === hash;
}
