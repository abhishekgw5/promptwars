/**
 * serverFetch — drop-in replacement for fetch() that handles self-signed
 * certificates injected by corporate proxies (WK workstations).
 *
 * On Vercel / clean environments the first call succeeds normally.
 * When a SELF_SIGNED_CERT error is detected it retries via an undici Agent
 * with rejectUnauthorized: false (scoped only to this request).
 */

const SSL_CERT_ERRORS = new Set([
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
]);

function isCertError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const cause = (err as any).cause;
    if (cause?.code && SSL_CERT_ERRORS.has(cause.code)) return true;
    if (cause?.cause?.code && SSL_CERT_ERRORS.has(cause.cause.code)) return true;
  }
  return false;
}

export async function serverFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: unknown) {
    if (isCertError(err)) {
      // Corporate proxy detected — retry with rejectUnauthorized: false
      const { Agent, fetch: undiciFetch } = await import('undici');
      const agent = new Agent({ connect: { rejectUnauthorized: false } });
      return undiciFetch(url as string, {
        ...(init as object),
        dispatcher: agent,
      }) as unknown as Response;
    }
    throw err;
  }
}
