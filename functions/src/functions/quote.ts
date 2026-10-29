import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { MAX_BODY_BYTES, parseQuoteRequest } from "../lib/quote.js";
import { providers as defaultProviders, selectNotifier, withTimeout, type Env, type NotifierRegistry } from "../lib/notifier.js";

export const NOTIFY_TIMEOUT_MS = 8000;

export interface QuoteHandlerOptions {
  env?: () => Env;
  providers?: NotifierRegistry;
  timeoutMs?: number;
}

function processEnv(): Env {
  return (globalThis as { process?: { env: Env } }).process?.env ?? {};
}

export function createQuoteHandler(options: QuoteHandlerOptions = {}) {
  const env = options.env ?? processEnv;
  const registry = options.providers ?? defaultProviders;
  const timeoutMs = options.timeoutMs ?? NOTIFY_TIMEOUT_MS;

  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
      return { status: 415, jsonBody: { ok: false, errors: {} } };
    }

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) {
      return { status: 400, jsonBody: { ok: false, errors: {} } };
    }

    const result = parseQuoteRequest(await request.text());
    if (!result.ok) {
      return { status: 400, jsonBody: { ok: false, errors: result.errors } };
    }

    const notifier = selectNotifier(env(), registry);
    if (!notifier) {
      return { status: 503, jsonBody: { ok: false } };
    }

    try {
      await withTimeout(notifier.send(result.value), timeoutMs);
    } catch {
      context.warn("Quote notifier failed");
      return { status: 502, jsonBody: { ok: false } };
    }

    return { status: 200, jsonBody: { ok: true } };
  };
}

app.http("quote", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "quote",
  handler: createQuoteHandler(),
});
