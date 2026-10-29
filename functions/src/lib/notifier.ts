import { formatQuoteEmail } from "./email.js";
import type { Quote } from "./quote.js";

export interface Notifier {
  send(quote: Quote): Promise<void>;
}

export type Env = Record<string, string | undefined>;

export type NotifierFactory = (env: Env) => Notifier;

export type NotifierRegistry = Record<string, NotifierFactory>;

export const NO_PROVIDER = "none";

export const RESEND_API_URL = "https://api.resend.com/emails";

function setting(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function createResendNotifier(env: Env, fetchImpl: typeof fetch = fetch): Notifier {
  const apiKey = setting(env, "RESEND_API_KEY");
  const from = setting(env, "QUOTE_FROM");
  const to = setting(env, "QUOTE_TO");
  return {
    async send(quote: Quote) {
      const email = formatQuoteEmail(quote);
      const response = await fetchImpl(RESEND_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject: email.subject, text: email.text, html: email.html }),
      });
      if (!response.ok) {
        throw new Error(`Resend returned ${response.status}`);
      }
    },
  };
}

export const providers: NotifierRegistry = {
  resend: (env) => createResendNotifier(env),
};

export function selectNotifier(env: Env, registry: NotifierRegistry = providers): Notifier | null {
  const name = (env.QUOTE_PROVIDER ?? NO_PROVIDER).trim().toLowerCase();
  if (name === "" || name === NO_PROVIDER || !Object.hasOwn(registry, name)) {
    return null;
  }
  try {
    return registry[name](env);
  } catch {
    return null;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error("Notifier timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
