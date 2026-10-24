import { readFileSync } from "node:fs";
import { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it } from "vitest";
import { MAX_BODY_BYTES, MIN_SUBMIT_MS, formatQuoteMessage, normalisePostcode } from "../lib/quote.js";
import { selectNotifier, type Notifier, type NotifierRegistry } from "../lib/notifier.js";
import { createQuoteHandler } from "./quote.js";

const now = 1_800_000_000_000;

const valid = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "b91 3qj",
  service: "Plastering",
  description: "Skim two bedroom ceilings & hallway, 50% done?",
  website: "",
  startedAt: now - 60_000,
};

class FakeNotifier implements Notifier {
  sent: string[] = [];
  constructor(private readonly behaviour: "ok" | "fail" | "hang" = "ok") {}
  send(text: string): Promise<void> {
    this.sent.push(text);
    if (this.behaviour === "fail") {
      return Promise.reject(new Error("provider rejected"));
    }
    if (this.behaviour === "hang") {
      return new Promise(() => {});
    }
    return Promise.resolve();
  }
}

function setup(options: { provider?: string; behaviour?: "ok" | "fail" | "hang"; misconfigured?: boolean } = {}) {
  const notifier = new FakeNotifier(options.behaviour);
  const providers: NotifierRegistry = {
    fake: () => {
      if (options.misconfigured) {
        throw new Error("missing setting");
      }
      return notifier;
    },
  };
  const env: Record<string, string | undefined> = {};
  if (options.provider !== undefined) {
    env.QUOTE_PROVIDER = options.provider;
  }
  const logs: string[] = [];
  const context = new InvocationContext({
    logHandler: (_level, ...args) => logs.push(args.map(String).join(" ")),
  });
  const handler = createQuoteHandler({ env: () => env, providers, now: () => now, timeoutMs: 20 });
  return { notifier, handler, context, logs };
}

function post(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new HttpRequest({
    method: "POST",
    url: "https://example.test/api/quote",
    body: { string: text },
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/quote", () => {
  it("sends the formatted message through the configured provider and returns 200", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post(valid), context);
    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual({ ok: true });
    expect(notifier.sent).toEqual([
      formatQuoteMessage({
        name: valid.name,
        phone: valid.phone,
        postcode: normalisePostcode(valid.postcode),
        service: "Plastering",
        description: valid.description,
      }),
    ]);
  });

  it("matches the provider name regardless of case and spacing", async () => {
    const { notifier, handler, context } = setup({ provider: "  FAKE " });
    const response = await handler(post(valid), context);
    expect(response.status).toBe(200);
    expect(notifier.sent).toHaveLength(1);
  });

  it.each([
    ["missing", undefined],
    ["none", "none"],
    ["empty", ""],
    ["unknown", "callmebot"],
  ])("returns 503 when the provider is %s", async (_label, provider) => {
    const { notifier, handler, context } = setup({ provider });
    const response = await handler(post(valid), context);
    expect(response.status).toBe(503);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 503 when the provider is misconfigured", async () => {
    const { notifier, handler, context } = setup({ provider: "fake", misconfigured: true });
    const response = await handler(post(valid), context);
    expect(response.status).toBe(503);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 400 with field errors for an invalid request without sending", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post({ ...valid, phone: "123", postcode: "" }), context);
    expect(response.status).toBe(400);
    expect(response.jsonBody).toMatchObject({ ok: false, errors: { phone: expect.any(String), postcode: expect.any(String) } });
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 400 for a filled honeypot without sending", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post({ ...valid, website: "http://spam.test" }), context);
    expect(response.status).toBe(400);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 400 for a too-fast submit without sending", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post({ ...valid, startedAt: now - MIN_SUBMIT_MS + 1 }), context);
    expect(response.status).toBe(400);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 400 for an oversized body without sending", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post({ ...valid, description: "x".repeat(MAX_BODY_BYTES) }), context);
    expect(response.status).toBe(400);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 400 when the declared content length is over the limit", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post(valid, { "content-length": String(MAX_BODY_BYTES + 1) }), context);
    expect(response.status).toBe(400);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 400 for malformed JSON without sending", async () => {
    const { notifier, handler, context } = setup({ provider: "fake" });
    const response = await handler(post("{not json"), context);
    expect(response.status).toBe(400);
    expect(notifier.sent).toHaveLength(0);
  });

  it("returns 502 when the notifier fails", async () => {
    const { handler, context } = setup({ provider: "fake", behaviour: "fail" });
    const response = await handler(post(valid), context);
    expect(response.status).toBe(502);
  });

  it("returns 502 when the notifier times out", async () => {
    const { handler, context } = setup({ provider: "fake", behaviour: "hang" });
    const response = await handler(post(valid), context);
    expect(response.status).toBe(502);
  });

  it("never logs submission contents", async () => {
    const runs = [
      setup({ provider: "fake" }),
      setup({ provider: "fake", behaviour: "fail" }),
      setup({ provider: "none" }),
      setup({ provider: "fake" }),
    ];
    await runs[0].handler(post(valid), runs[0].context);
    await runs[1].handler(post(valid), runs[1].context);
    await runs[2].handler(post(valid), runs[2].context);
    await runs[3].handler(post({ ...valid, phone: "bad" }), runs[3].context);
    const logged = runs.flatMap((run) => run.logs).join("\n");
    for (const value of [valid.name, valid.phone, "B91", valid.description, "bad"]) {
      expect(logged).not.toContain(value);
    }
  });
});

describe("selectNotifier", () => {
  it("defaults to no notifier in production, where no providers are registered", () => {
    expect(selectNotifier({ QUOTE_PROVIDER: "none" })).toBeNull();
    expect(selectNotifier({ QUOTE_PROVIDER: "callmebot" })).toBeNull();
    expect(selectNotifier({})).toBeNull();
  });
});

describe("shared validator copy", () => {
  it("is identical to frontend/src/lib/quote.ts", () => {
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
    expect(read("../lib/quote.ts")).toBe(read("../../../frontend/src/lib/quote.ts"));
  });
});
