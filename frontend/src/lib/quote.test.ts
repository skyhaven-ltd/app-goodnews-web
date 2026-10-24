import { describe, expect, it } from "vitest";
import { business } from "../data/business";
import {
  MAX_BODY_BYTES,
  MIN_SUBMIT_MS,
  QUOTE_SERVICES,
  buildSmsUrl,
  buildWhatsAppUrl,
  formatQuoteMessage,
  isUkPhone,
  isUkPostcode,
  parseQuoteRequest,
  validateQuote,
  type Quote,
} from "./quote";

const now = 1_800_000_000_000;

const valid = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "b91 3qj",
  service: "Plastering",
  description: "Skim two bedroom ceilings after Artex removal.",
  website: "",
  startedAt: now - 60_000,
};

describe("business config", () => {
  it("holds Darren's contact details in one place", () => {
    expect(business.owner).toBe("Darren Goodchild");
    expect(business.phone.display).toBe("07456 182265");
    expect(business.phone.tel).toBe("+447456182265");
    expect(business.whatsapp).toBe("447456182265");
  });

  it("marks unknown values as placeholders", () => {
    expect(business.email).toBe("[PLACEHOLDER]");
  });
});

describe("isUkPhone", () => {
  it.each(["07700 900123", "07700900123", "+44 7700 900123", "+447700900123", "0121 496 0000", "(01386) 496000", "0044 7700 900123"])(
    "accepts %s",
    (value) => {
      expect(isUkPhone(value)).toBe(true);
    },
  );

  it.each(["", "12345", "0770090012", "077009001234", "+1 202 555 0100", "07700 9OO123", "00000000000"])("rejects %s", (value) => {
    expect(isUkPhone(value)).toBe(false);
  });
});

describe("isUkPostcode", () => {
  it.each(["B91 3QJ", "b913qj", "WR11 4AA", "CV37 6BB", "SW1A 1AA", "M1 1AE", " b93  8ab "])("accepts %s", (value) => {
    expect(isUkPostcode(value)).toBe(true);
  });

  it.each(["", "B91", "12345", "B91 3Q", "QQ1 1AA1", "B91-3QJ"])("rejects %s", (value) => {
    expect(isUkPostcode(value)).toBe(false);
  });
});

describe("validateQuote", () => {
  it("accepts a complete request and normalises it", () => {
    const result = validateQuote({ ...valid, name: "  Jane Smith " }, now);
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Jane Smith",
        phone: "07700 900123",
        postcode: "B91 3QJ",
        service: "Plastering",
        description: "Skim two bedroom ceilings after Artex removal.",
      },
    });
  });

  it("reports every missing field", () => {
    const result = validateQuote({ website: "", startedAt: valid.startedAt }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["description", "name", "phone", "postcode", "service"]);
      expect(result.spam).toBe(false);
    }
  });

  it("rejects fields that are only whitespace", () => {
    const result = validateQuote({ ...valid, name: "   ", description: "\n\t" }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["description", "name"]);
    }
  });

  it("rejects an invalid phone and postcode", () => {
    const result = validateQuote({ ...valid, phone: "12345", postcode: "nowhere" }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.phone).toBeDefined();
      expect(result.errors.postcode).toBeDefined();
    }
  });

  it("rejects a service that is not offered", () => {
    const result = validateQuote({ ...valid, service: "Plumbing" }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.service).toBeDefined();
    }
  });

  it("rejects fields that are too long", () => {
    const result = validateQuote({ ...valid, name: "a".repeat(101), description: "b".repeat(2001) }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.description).toBeDefined();
    }
  });

  it("rejects non-string field values", () => {
    const result = validateQuote({ ...valid, name: 42, phone: ["07700900123"] }, now);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    }
  });

  it("rejects a filled honeypot as spam", () => {
    const result = validateQuote({ ...valid, website: "http://spam.example" }, now);
    expect(result).toMatchObject({ ok: false, spam: true });
  });

  it("rejects a submit faster than the minimum time as spam", () => {
    const result = validateQuote({ ...valid, startedAt: now - (MIN_SUBMIT_MS - 1) }, now);
    expect(result).toMatchObject({ ok: false, spam: true });
  });

  it("accepts a submit at exactly the minimum time", () => {
    expect(validateQuote({ ...valid, startedAt: now - MIN_SUBMIT_MS }, now).ok).toBe(true);
  });

  it("rejects a missing or future start time as spam", () => {
    expect(validateQuote({ ...valid, startedAt: undefined }, now)).toMatchObject({ ok: false, spam: true });
    expect(validateQuote({ ...valid, startedAt: now + 10_000 }, now)).toMatchObject({ ok: false, spam: true });
    expect(validateQuote({ ...valid, startedAt: "soon" }, now)).toMatchObject({ ok: false, spam: true });
  });

  it("rejects input that is not an object", () => {
    expect(validateQuote(null, now).ok).toBe(false);
    expect(validateQuote("hello", now).ok).toBe(false);
    expect(validateQuote([valid], now).ok).toBe(false);
  });
});

describe("parseQuoteRequest", () => {
  it("parses and validates a JSON body", () => {
    const result = parseQuoteRequest(JSON.stringify(valid), now);
    expect(result.ok).toBe(true);
  });

  it("rejects a body over the size limit", () => {
    const body = JSON.stringify({ ...valid, description: "x".repeat(MAX_BODY_BYTES) });
    expect(parseQuoteRequest(body, now)).toMatchObject({ ok: false, tooLarge: true });
  });

  it("measures the size limit in bytes, not characters", () => {
    const body = JSON.stringify({ ...valid, description: "£".repeat(2500) });
    expect(body.length).toBeLessThan(MAX_BODY_BYTES);
    expect(parseQuoteRequest(body, now)).toMatchObject({ ok: false, tooLarge: true });
  });

  it("rejects malformed JSON", () => {
    expect(parseQuoteRequest("{not json", now).ok).toBe(false);
  });
});

describe("formatQuoteMessage", () => {
  const quote: Quote = {
    name: "Jane Smith",
    phone: "07700 900123",
    postcode: "B91 3QJ",
    service: "Plastering",
    description: "Skim two ceilings.",
  };

  it("lists every detail under the intro", () => {
    expect(formatQuoteMessage(quote, "Hi Darren, I'd like a quote.")).toBe(
      [
        "Hi Darren, I'd like a quote.",
        "",
        "Name: Jane Smith",
        "Phone: 07700 900123",
        "Postcode: B91 3QJ",
        "Service: Plastering",
        "",
        "Job:",
        "Skim two ceilings.",
      ].join("\n"),
    );
  });

  it("uses a default intro for automatic delivery", () => {
    expect(formatQuoteMessage(quote).split("\n")[0]).toBe("New quote request from the website");
  });
});

describe("buildWhatsAppUrl", () => {
  it("builds a wa.me link with the text encoded", () => {
    const url = buildWhatsAppUrl("447456182265", "Hi & welcome\nLine 2 ? 50% #1 £20 café 👍");
    expect(url).toBe(
      "https://wa.me/447456182265?text=Hi%20%26%20welcome%0ALine%202%20%3F%2050%25%20%231%20%C2%A320%20caf%C3%A9%20%F0%9F%91%8D",
    );
    expect(new URL(url).searchParams.get("text")).toBe("Hi & welcome\nLine 2 ? 50% #1 £20 café 👍");
  });

  it("strips anything but digits from the number", () => {
    expect(buildWhatsAppUrl("+44 7456 182265", "Hi")).toBe("https://wa.me/447456182265?text=Hi");
  });
});

describe("buildSmsUrl", () => {
  it("builds an sms link with the body encoded", () => {
    expect(buildSmsUrl("+447456182265", "A&B\nC")).toBe("sms:+447456182265?body=A%26B%0AC");
  });
});

describe("QUOTE_SERVICES", () => {
  it("offers the lead services first and an other option", () => {
    expect(QUOTE_SERVICES.slice(0, 3)).toEqual(["Plastering", "Painting & Decorating", "Gardening & Landscaping"]);
    expect(QUOTE_SERVICES).toContain("Other");
  });
});
