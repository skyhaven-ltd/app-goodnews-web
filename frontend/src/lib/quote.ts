export const QUOTE_SERVICES = [
  "Plastering",
  "Painting & Decorating",
  "Gardening & Landscaping",
  "Kitchen fitting",
  "Carpentry & panelling",
  "Loft conversion",
  "Other",
] as const;

export type QuoteService = (typeof QUOTE_SERVICES)[number];

export const PREFERRED_CONTACTS = ["whatsapp", "call", "text"] as const;

export type PreferredContact = (typeof PREFERRED_CONTACTS)[number];

export const PREFERRED_CONTACT_LABELS: Record<PreferredContact, string> = {
  whatsapp: "WhatsApp",
  call: "Call",
  text: "Text",
};

export const MIN_SUBMIT_MS = 3000;
export const MAX_BODY_BYTES = 5 * 1024;

export const FIELD_LIMITS = {
  name: 100,
  phone: 30,
  postcode: 10,
  description: 2000,
} as const;

export type QuoteField = "name" | "phone" | "postcode" | "service" | "preferredContact" | "description";

export interface Quote {
  name: string;
  phone: string;
  postcode: string;
  service: QuoteService;
  preferredContact: PreferredContact;
  description: string;
}

export type QuoteErrors = Partial<Record<QuoteField, string>>;

export type QuoteResult =
  | { ok: true; value: Quote }
  | { ok: false; errors: QuoteErrors; spam: boolean; tooLarge?: boolean };

const PHONE_PATTERN = /^(?:\+44|0044|0)(?:7\d{9}|[1-3]\d{8,9}|[589]\d{9})$/;
const POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/;

export function isUkPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.replace(/[\s().-]/g, ""));
}

function compactPostcode(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isUkPostcode(value: string): boolean {
  return POSTCODE_PATTERN.test(compactPostcode(value));
}

export function normalisePostcode(value: string): string {
  const compact = compactPostcode(value);
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function isService(value: string): value is QuoteService {
  return (QUOTE_SERVICES as readonly string[]).includes(value);
}

function isPreferredContact(value: string): value is PreferredContact {
  return (PREFERRED_CONTACTS as readonly string[]).includes(value);
}

function isSpam(input: Record<string, unknown>): boolean {
  const honeypot = input.website;
  if (honeypot !== undefined && honeypot !== "") {
    return true;
  }
  const elapsedMs = input.elapsedMs;
  return !(typeof elapsedMs === "number" && elapsedMs >= MIN_SUBMIT_MS);
}

export type QuoteFieldsResult = { ok: true; value: Quote } | { ok: false; errors: QuoteErrors };

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function validateQuoteFields(input: unknown): QuoteFieldsResult {
  const data = isRecord(input) ? input : {};
  const errors: QuoteErrors = {};

  const name = text(data.name)?.replace(/[\s\p{Cc}]+/gu, " ").trim();
  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length > FIELD_LIMITS.name) {
    errors.name = `Please keep your name under ${FIELD_LIMITS.name} characters.`;
  }

  const phone = text(data.phone);
  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else if (phone.length > FIELD_LIMITS.phone || !isUkPhone(phone)) {
    errors.phone = "Please enter a UK phone number, such as 07700 900123.";
  }

  const postcode = text(data.postcode);
  if (!postcode) {
    errors.postcode = "Please enter your postcode.";
  } else if (postcode.length > FIELD_LIMITS.postcode || !isUkPostcode(postcode)) {
    errors.postcode = "Please enter a full UK postcode, such as B91 3QJ.";
  }

  const service = text(data.service);
  if (!service || !isService(service)) {
    errors.service = "Please choose a service.";
  }

  const preferredContact = text(data.preferredContact);
  if (!preferredContact || !isPreferredContact(preferredContact)) {
    errors.preferredContact = "Please choose how we should get back to you.";
  }

  const description = text(data.description);
  if (!description) {
    errors.description = "Please describe the job.";
  } else if (description.length > FIELD_LIMITS.description) {
    errors.description = `Please keep the description under ${FIELD_LIMITS.description} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name: name as string,
      phone: phone as string,
      postcode: normalisePostcode(postcode as string),
      service: service as QuoteService,
      preferredContact: preferredContact as PreferredContact,
      description: description as string,
    },
  };
}

export function validateQuote(input: unknown): QuoteResult {
  if (!isRecord(input)) {
    return { ok: false, errors: {}, spam: false };
  }
  const fields = validateQuoteFields(input);
  const spam = isSpam(input);
  if (!fields.ok) {
    return { ok: false, errors: fields.errors, spam };
  }
  if (spam) {
    return { ok: false, errors: {}, spam };
  }
  return fields;
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function parseQuoteRequest(body: string): QuoteResult {
  if (byteLength(body) > MAX_BODY_BYTES) {
    return { ok: false, errors: {}, spam: false, tooLarge: true };
  }
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false, errors: {}, spam: false };
  }
  return validateQuote(data);
}

export function formatQuoteMessage(quote: Quote): string {
  return [
    "Hi, I'd like a quote please.",
    "",
    `Name: ${quote.name}`,
    `Phone: ${quote.phone}`,
    `Postcode: ${quote.postcode}`,
    `Service: ${quote.service}`,
    "",
    "Job:",
    quote.description,
    "",
    "I'll send a few photos of the job in this chat.",
  ].join("\n");
}

export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export function buildSmsUrl(phone: string, message: string): string {
  return `sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(message)}`;
}
