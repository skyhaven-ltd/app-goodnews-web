import {
  buildSmsUrl,
  buildWhatsAppUrl,
  formatQuoteMessage,
  validateQuoteFields,
  type Quote,
  type QuoteErrors,
  type QuoteField,
} from "../lib/quote";

const FIELD_ORDER: QuoteField[] = ["name", "phone", "postcode", "service", "description"];

export function initQuoteForm(form: HTMLFormElement) {
  const whatsappNumber = form.dataset.whatsapp ?? "";
  const smsNumber = form.dataset.sms ?? "";
  const smsLink = form.querySelector<HTMLAnchorElement>("[data-action=sms]")!;

  function readFields() {
    const data = new FormData(form);
    return {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      postcode: String(data.get("postcode") ?? ""),
      service: String(data.get("service") ?? ""),
      preferredContact: "whatsapp",
      description: String(data.get("description") ?? ""),
    };
  }

  function fieldControl(field: QuoteField): HTMLElement | null {
    if (field === "service") {
      return form.querySelector<HTMLElement>("[data-field=service]");
    }
    return form.querySelector<HTMLElement>(`[name=${field}]`);
  }

  function focusTarget(field: QuoteField): HTMLElement | null {
    if (field === "service") {
      return form.querySelector<HTMLElement>("input[name=service]");
    }
    return fieldControl(field);
  }

  function showErrors(errors: QuoteErrors) {
    for (const field of FIELD_ORDER) {
      const message = errors[field];
      const output = form.querySelector<HTMLElement>(`[data-error=${field}]`);
      const control = fieldControl(field);
      if (output) {
        output.textContent = message ?? "";
        output.hidden = !message;
      }
      if (message) {
        control?.setAttribute("aria-invalid", "true");
      } else {
        control?.removeAttribute("aria-invalid");
      }
    }
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) {
      focusTarget(first)?.focus();
    }
  }

  function checkFields(): Quote | undefined {
    const result = validateQuoteFields(readFields());
    showErrors(result.ok ? {} : result.errors);
    return result.ok ? result.value : undefined;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const quote = checkFields();
    if (!quote) {
      return;
    }
    window.location.assign(buildWhatsAppUrl(whatsappNumber, formatQuoteMessage(quote)));
  });

  smsLink.addEventListener("click", (event) => {
    const quote = checkFields();
    if (!quote) {
      event.preventDefault();
      return;
    }
    smsLink.href = buildSmsUrl(smsNumber, formatQuoteMessage(quote));
  });
}
