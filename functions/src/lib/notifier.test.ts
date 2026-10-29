import { describe, expect, it, vi } from "vitest";
import { formatQuoteEmail } from "./email.js";
import { RESEND_API_URL, createResendNotifier, selectNotifier } from "./notifier.js";
import type { Quote } from "./quote.js";

const quote: Quote = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "B91 3QJ",
  service: "Plastering",
  preferredContact: "whatsapp",
  description: "Skim two ceilings.",
};

const env = {
  QUOTE_PROVIDER: "resend",
  RESEND_API_KEY: "test-key",
  QUOTE_FROM: "Good News Plastering <quotes@goodnewsplastering.co.uk>",
  QUOTE_TO: "goodnewsplastering@gmail.com",
};

function fakeFetch(status = 200) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "email-id" }), { status }));
}

describe("createResendNotifier", () => {
  it("posts the formatted email to Resend with the API key", async () => {
    const fetchImpl = fakeFetch();
    await createResendNotifier(env, fetchImpl).send(quote);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(RESEND_API_URL);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ Authorization: "Bearer test-key", "Content-Type": "application/json" });
    const email = formatQuoteEmail(quote);
    expect(JSON.parse(String(init?.body))).toEqual({
      from: env.QUOTE_FROM,
      to: [env.QUOTE_TO],
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  });

  it("rejects when Resend returns an error status", async () => {
    await expect(createResendNotifier(env, fakeFetch(422)).send(quote)).rejects.toThrow("422");
  });

  it("rejects when the request fails", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(createResendNotifier(env, fetchImpl).send(quote)).rejects.toThrow();
  });

  it.each(["RESEND_API_KEY", "QUOTE_FROM", "QUOTE_TO"])("throws when %s is missing or blank", (name) => {
    expect(() => createResendNotifier({ ...env, [name]: undefined }, fakeFetch())).toThrow();
    expect(() => createResendNotifier({ ...env, [name]: "  " }, fakeFetch())).toThrow();
  });
});

describe("selectNotifier", () => {
  it("selects Resend when it is configured", () => {
    expect(selectNotifier(env)).not.toBeNull();
    expect(selectNotifier({ ...env, QUOTE_PROVIDER: " Resend " })).not.toBeNull();
  });

  it("returns no notifier when Resend is missing a setting", () => {
    expect(selectNotifier({ ...env, RESEND_API_KEY: undefined })).toBeNull();
  });

  it("returns no notifier for none, an empty or an unknown provider", () => {
    expect(selectNotifier({ ...env, QUOTE_PROVIDER: "none" })).toBeNull();
    expect(selectNotifier({ ...env, QUOTE_PROVIDER: "" })).toBeNull();
    expect(selectNotifier({ ...env, QUOTE_PROVIDER: "callmebot" })).toBeNull();
    expect(selectNotifier({})).toBeNull();
  });
});
