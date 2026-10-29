import { describe, expect, it } from "vitest";
import { formatQuoteEmail, internationalNumber } from "./email.js";
import type { Quote } from "./quote.js";

const quote: Quote = {
  name: "Jane Smith",
  phone: "07700 900123",
  postcode: "B91 3QJ",
  service: "Painting & Decorating",
  preferredContact: "call",
  description: "Paint the hall & stairs.\nCeiling has <cracks>.",
};

const greeting = "Hi Jane, it's Good News Plastering about your quote request.";
const whatsappUrl = `https://wa.me/447700900123?text=${encodeURIComponent(greeting)}`;
const smsUrl = `sms:+447700900123?&body=${encodeURIComponent(greeting)}`;

describe("internationalNumber", () => {
  it.each([
    ["07700 900123", "447700900123"],
    ["+44 7700 900123", "447700900123"],
    ["0044 7700 900123", "447700900123"],
    ["(01386) 496000", "441386496000"],
  ])("turns %s into %s", (phone, expected) => {
    expect(internationalNumber(phone)).toBe(expected);
  });
});

describe("formatQuoteEmail", () => {
  it("puts the service and postcode in the subject", () => {
    expect(formatQuoteEmail(quote).subject).toBe("Quote request: Painting & Decorating, B91 3QJ");
  });

  it("writes a plain text body with the details and reply links", () => {
    expect(formatQuoteEmail(quote).text).toBe(
      [
        "New quote request from the website",
        "",
        "Name: Jane Smith",
        "Phone: 07700 900123",
        "Postcode: B91 3QJ",
        "Service: Painting & Decorating",
        "Get back to them by: Call",
        "",
        "Job:",
        "Paint the hall & stairs.",
        "Ceiling has <cracks>.",
        "",
        `WhatsApp Jane Smith: ${whatsappUrl}`,
        "Call: tel:+447700900123",
        `Text: ${smsUrl}`,
      ].join("\n"),
    );
  });

  it("writes an HTML body with the details and reply links", () => {
    const { html } = formatQuoteEmail(quote);
    expect(html).toContain("Name: Jane Smith<br>");
    expect(html).toContain("Service: Painting &amp; Decorating<br>");
    expect(html).toContain("Get back to them by: Call</p>");
    expect(html).toContain("Paint the hall &amp; stairs.\nCeiling has &lt;cracks&gt;.");
    const attribute = (value: string) => value.replace(/&/g, "&amp;").replace(/'/g, "&#39;");
    expect(html).toContain(`<a href="${attribute(whatsappUrl)}">WhatsApp Jane Smith</a>`);
    expect(html).toContain('<a href="tel:+447700900123">Call</a>');
    expect(html).toContain(`<a href="${attribute(smsUrl)}">Text</a>`);
  });

  it("escapes customer text in the HTML body", () => {
    const { html } = formatQuoteEmail({ ...quote, name: `<script>alert("x")</script> O'Neil`, description: "<img src=x onerror=alert(1)>" });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; O&#39;Neil");
  });

  it("does not name the owner", () => {
    const email = formatQuoteEmail(quote);
    expect(`${email.subject}${email.text}${email.html}`).not.toContain("Darren");
  });
});
