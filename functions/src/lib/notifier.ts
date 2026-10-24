export interface Notifier {
  send(text: string): Promise<void>;
}

export type Env = Record<string, string | undefined>;

export type NotifierFactory = (env: Env) => Notifier;

export type NotifierRegistry = Record<string, NotifierFactory>;

export const NO_PROVIDER = "none";

export const providers: NotifierRegistry = {};

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
