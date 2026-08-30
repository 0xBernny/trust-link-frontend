# Environment Variables

This document describes all environment variables used by the TrustLink frontend application.

## Required Variables

These variables must be set for the application to start:

### `NEXT_PUBLIC_API_URL`

- **Required**: Yes
- **Purpose**: Backend API base URL for all server requests
- **Example**: `http://localhost:3001` (local) or `https://api.trustlink.app` (production)
- **Exposed to Frontend**: Yes (prefix `NEXT_PUBLIC_`)
- **Used in**: API client, escrow operations, payment flows

### `NEXT_PUBLIC_STELLAR_NETWORK`

- **Required**: Yes
- **Purpose**: Stellar network identifier (testnet or mainnet)
- **Example**: `testnet` or `mainnet`
- **Exposed to Frontend**: Yes
- **Used in**: Wallet connections, contract calls, Horizon API interactions

## Optional Variables

### Stellar Configuration

#### `NEXT_PUBLIC_CONTRACT_ID`

- **Required**: No (but needed for escrow operations)
- **Purpose**: Soroban smart contract address for escrow operations
- **Example**: `CDQR3...` (44-character contract ID)
- **Exposed to Frontend**: Yes
- **Used in**: Escrow creation, funding, release operations

#### `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`

- **Required**: No (defaults to standard network passphrases)
- **Purpose**: Network passphrase for transaction signing
- **Example**: `Test SDF Network ; September 2015` (testnet)
- **Exposed to Frontend**: Yes
- **Used in**: Transaction signing, network validation

#### `NEXT_PUBLIC_SOROBAN_RPC_URL`

- **Required**: No (defaults to `https://soroban-testnet.stellar.org`)
- **Purpose**: Soroban RPC endpoint for contract interactions
- **Example**: `https://soroban-testnet.stellar.org`
- **Exposed to Frontend**: Yes
- **Used in**: Contract queries, transaction submission

### SEO & Metadata

#### `NEXT_PUBLIC_SITE_URL`

- **Required**: No
- **Purpose**: Public site URL used in sitemap.xml and robots.txt
- **Example**: `https://trustlink.app`
- **Exposed to Frontend**: Yes
- **Used in**: SEO metadata, sitemaps, canonical URLs

#### `NEXT_PUBLIC_APP_URL`

- **Required**: No
- **Purpose**: Application URL used in page metadata and social sharing
- **Example**: `https://trustlink.app`
- **Exposed to Frontend**: Yes
- **Used in**: Open Graph tags, Twitter cards, metadata

### Error Tracking (Sentry)

#### `NEXT_PUBLIC_SENTRY_DSN`

- **Required**: No (but recommended for production)
- **Purpose**: Sentry Data Source Name for error tracking
- **Example**: `https://examplePublicKey@o0.ingest.sentry.io/0`
- **Exposed to Frontend**: Yes
- **Used in**: Client-side error reporting, server-side error tracking, edge runtime errors
- **Note**: Works for client, server, and edge runtimes

#### `SENTRY_AUTH_TOKEN`

- **Required**: No (only needed for builds with source map uploads)
- **Purpose**: Sentry authentication token for uploading source maps during build
- **Example**: `sntrys_...`
- **Exposed to Frontend**: No (server-only)
- **Used in**: Build-time source map uploads
- **Security**: Keep private, never commit to repository

### Analytics (PostHog)

#### `NEXT_PUBLIC_POSTHOG_KEY`

- **Required**: No
- **Purpose**: PostHog project API key for product analytics
- **Example**: `phc_...`
- **Exposed to Frontend**: Yes
- **Used in**: User behavior tracking, feature analytics, A/B testing

#### `NEXT_PUBLIC_POSTHOG_DISABLED`

- **Required**: No (defaults to `false`)
- **Purpose**: Flag to completely disable PostHog analytics
- **Example**: `true` or `false`
- **Exposed to Frontend**: Yes
- **Used in**: Disabling analytics in development or for privacy compliance

### Rate Limiting (Upstash Redis)

#### `UPSTASH_REDIS_REST_URL`

- **Required**: No (falls back to in-memory rate limiting)
- **Purpose**: Upstash Redis REST URL for distributed rate limiting
- **Example**: `https://example-12345.upstash.io`
- **Exposed to Frontend**: No (server-only)
- **Used in**: API route rate limiting
- **Note**: When unset, uses in-memory fallback (suitable for development)

#### `UPSTASH_REDIS_REST_TOKEN`

- **Required**: No (only needed if `UPSTASH_REDIS_REST_URL` is set)
- **Purpose**: Upstash Redis authentication token
- **Example**: `AXXXaaaaBBBbbb...`
- **Exposed to Frontend**: No (server-only)
- **Used in**: API route rate limiting authentication
- **Security**: Keep private, never commit to repository

## Variable Exposure Rules

### Frontend-Exposed Variables (`NEXT_PUBLIC_` prefix)

Variables with the `NEXT_PUBLIC_` prefix are:

- **Bundled into the client-side JavaScript**
- **Visible in browser DevTools and network requests**
- **Safe to use in client components and hooks**
- **Should NOT contain secrets or private keys**

Examples: API URLs, network identifiers, public keys, feature flags

### Server-Only Variables (no prefix)

Variables without the `NEXT_PUBLIC_` prefix are:

- **Only available in server-side code** (API routes, server components, middleware)
- **Never sent to the browser**
- **Safe for secrets and tokens**
- **Cannot be accessed in client components**

Examples: Database credentials, API tokens, authentication secrets

## Environment-Specific Configuration

### Development (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CDQR3...
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_POSTHOG_DISABLED=true
```

### Production

```env
NEXT_PUBLIC_API_URL=https://api.trustlink.app
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_CONTRACT_ID=CDQR3...
NEXT_PUBLIC_SITE_URL=https://trustlink.app
NEXT_PUBLIC_APP_URL=https://trustlink.app
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AXXXaaaa...
```

## Validation

The `env-validation.js` script runs at build time and startup to verify required variables are present. Add new required variables to the `REQUIRED_VARIABLES` array in that file.

## Security Best Practices

1. **Never commit `.env.local` or `.env.production` files** - these contain secrets
2. **Use `.env.example` as a template** - safe to commit, no real values
3. **Rotate tokens regularly** - especially Sentry and Upstash tokens
4. **Use separate credentials per environment** - don't reuse production tokens in staging
5. **Audit `NEXT_PUBLIC_` variables** - ensure they don't expose sensitive data
6. **Use environment-specific API endpoints** - never point development to production APIs

## Troubleshooting

### "Missing environment configuration" error

- Check that all variables in `REQUIRED_VARIABLES` (see `env-validation.js`) are set
- Ensure `.env.local` exists and contains the required variables
- Restart the development server after adding new variables

### Variables not updating

- Restart the Next.js dev server - env vars are loaded at startup
- Check for typos in variable names
- Verify `NEXT_PUBLIC_` prefix for client-side variables

### "undefined" in client components

- Server-only variables (no `NEXT_PUBLIC_` prefix) cannot be accessed in client components
- Add `NEXT_PUBLIC_` prefix if the variable needs to be available client-side
- Consider using an API route to securely access server-only data
