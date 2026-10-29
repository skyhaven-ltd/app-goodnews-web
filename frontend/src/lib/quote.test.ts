import { describe, expect, it } from "vitest";
import { PLACEHOLDER, business } from "../data/business";
import {
  QUOTE_SERVICES,
  buildSmsUrl,
  buildWhatsAppUrl,
  formatQuoteMessage,
  isUkPhone,
  isUkPostcode,
  validateQuoteFields,
  type Quote,
} from "./quote";

const valid = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "b91 3qj",
  service: "Plastering",
  description: "Skim two bedroom ceilings after Artex removal.",
};

describe("business config", () => {
  it("holds Darren's contact details in one place", () => {
    expect(business.owner).toBe("Darren Goodchild");
    expect(business.phone.display).toBe("07456 182265");
    expect(business.phone.tel).toBe("+447456182265");
    expect(business.whatsapp).toBe("447456182265");
  });

  it("holds the contact email and keeps the placeholder marker", () => {
    expect(business.email).toBe("goodnewsplastering@gmail.com");
    expect(PLACEHOLDER).toBe("[PLACEHOLDER]");
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

describe("validateQuoteFields", () => {
  it("accepts a complete request and normalises it", () => {
    const result = validateQuoteFields({ ...valid, name: "  Jane Smith " });
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

  it("collapses control characters and newlines in the name to a single space", () => {
    const result = validateQuoteFields({ ...valid, name: "Jane\r\n\r\nPhone: 0800 000000\u0000\tSmith " });
    expect(result).toMatchObject({ ok: true, value: { name: "Jane Phone: 0800 000000 Smith" } });
  });

  it("reports every missing field", () => {
    const result = validateQuoteFields({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["description", "name", "phone", "postcode", "service"]);
    }
  });

  it("rejects fields that are only whitespace", () => {
    const result = validateQuoteFields({ ...valid, name: "   ", description: "\n\t" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["description", "name"]);
    }
  });

  it("rejects an invalid phone and postcode", () => {
    const result = validateQuoteFields({ ...valid, phone: "12345", postcode: "nowhere" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.phone).toBeDefined();
      expect(result.errors.postcode).toBeDefined();
    }
  });

  it("rejects a service that is not offered", () => {
    const result = validateQuoteFields({ ...valid, service: "Plumbing" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.service).toBeDefined();
    }
  });

  it("rejects fields that are too long", () => {
    const result = validateQuoteFields({ ...valid, name: "a".repeat(101), description: "b".repeat(2001) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.description).toBeDefined();
    }
  });

  it("rejects non-string field values", () => {
    const result = validateQuoteFields({ ...valid, name: 42, phone: ["07700900123"] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    }
  });

  it("rejects input that is not an object", () => {
    expect(validateQuoteFields(null).ok).toBe(false);
    expect(validateQuoteFields("hello").ok).toBe(false);
    expect(validateQuoteFields([valid]).ok).toBe(false);
  });

  it("reports field errors", () => {
    const result = validateQuoteFields({ ...valid, phone: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors)).toEqual(["phone"]);
    }
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

  it("writes the customer's WhatsApp message and asks for photos", () => {
    expect(formatQuoteMessage(quote)).toBe(
      [
        "Hi, I'd like a quote please.",
        "",
        "Name: Jane Smith",
        "Phone: 07700 900123",
        "Postcode: B91 3QJ",
        "Service: Plastering",
        "",
        "Job:",
        "Skim two ceilings.",
        "",
        "I'll send a few photos of the job in this chat.",
      ].join("\n"),
    );
  });

  it("does not name the owner", () => {
    expect(formatQuoteMessage(quote)).not.toContain("Darren");
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
    expect(buildSmsUrl("+447456182265", "A&B\nC")).toBe("sms:+447456182265?&body=A%26B%0AC");
  });
});

describe("QUOTE_SERVICES", () => {
  it("offers the lead services first and an other option", () => {
    expect(QUOTE_SERVICES.slice(0, 3)).toEqual(["Plastering", "Painting & Decorating", "Gardening & Landscaping"]);
    expect(QUOTE_SERVICES).toContain("Other");
  });
});
