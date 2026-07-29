/**
 * Back-compat surface for the pre-#424 Sentry helpers.
 *
 * The implementation now lives in `lib/logger.ts`, which attaches the connected
 * wallet address and subsystem tags to every event. New code should import from
 * `@/lib/logger` directly.
 */

import * as Sentry from "@sentry/nextjs";

export { setEscrowContext, captureWalletError, captureError, setLoggerUser } from "@/lib/logger";

export default Sentry;
