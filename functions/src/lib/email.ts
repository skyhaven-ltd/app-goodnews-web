import { PREFERRED_CONTACT_LABELS, buildSmsUrl, buildWhatsAppUrl, type Quote } from "./quote.js";

export const BUSINESS_NAME = "Good News Plastering";

export interface QuoteEmail {
  subject: string;
  text: string;
  html: string;
}

export function internationalNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0044")) {
    return digits.slice(2);
  }
  if (digits.startsWith("44")) {
    return digits;
  }
  return `44${digits.slice(1)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replyLinks(quote: Quote) {
  const number = internationalNumber(quote.phone);
  const firstName = quote.name.split(" ")[0];
  const greeting = `Hi ${firstName}, it's ${BUSINESS_NAME} about your quote request.`;
  return {
    whatsapp: buildWhatsAppUrl(number, greeting),
    call: `tel:+${number}`,
    text: buildSmsUrl(`+${number}`, greeting),
  };
}

export function formatQuoteEmail(quote: Quote): QuoteEmail {
  const links = replyLinks(quote);
  const contact = PREFERRED_CONTACT_LABELS[quote.preferredContact];
  const details = [
    `Name: ${quote.name}`,
    `Phone: ${quote.phone}`,
    `Postcode: ${quote.postcode}`,
    `Service: ${quote.service}`,
    `Get back to them by: ${contact}`,
  ];

  const text = [
    "New quote request from the website",
    "",
    ...details,
    "",
    "Job:",
    quote.description,
    "",
    `WhatsApp ${quote.name}: ${links.whatsapp}`,
    `Call: ${links.call}`,
    `Text: ${links.text}`,
  ].join("\n");

  const link = (href: string, label: string) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  const html = [
    "<p>New quote request from the website</p>",
    `<p>${details.map(escapeHtml).join("<br>")}</p>`,
    "<p><strong>Job:</strong></p>",
    `<p style="white-space:pre-wrap">${escapeHtml(quote.description)}</p>`,
    `<p>${[link(links.whatsapp, `WhatsApp ${quote.name}`), link(links.call, "Call"), link(links.text, "Text")].join(" | ")}</p>`,
  ].join("\n");

  return {
    subject: `Quote request: ${quote.service}, ${quote.postcode}`,
    text,
    html,
  };
}
