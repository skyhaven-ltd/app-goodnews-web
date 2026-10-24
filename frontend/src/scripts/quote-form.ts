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
const DEFAULT_TIMEOUT_MS = 10_000;

export function initQuoteForm(form: HTMLFormElement) {
  const whatsappNumber = form.dataset.whatsapp ?? "";
  const smsNumber = form.dataset.sms ?? "";
  const intro = `Hi ${form.dataset.owner ?? ""}, I'd like a quote.`;
  const sendButton = form.querySelector<HTMLButtonElement>("[data-action=send]")!;
  const sendLabel = sendButton.querySelector<HTMLElement>("[data-label]")!;
  const whatsappButton = form.querySelector<HTMLButtonElement>("[data-action=whatsapp]")!;
  const success = form.querySelector<HTMLElement>("[data-testid=quote-success]")!;
  const fallback = form.querySelector<HTMLElement>("[data-testid=quote-fallback]")!;
  const fallbackWhatsApp = fallback.querySelector<HTMLAnchorElement>("[data-fallback=whatsapp]")!;
  const fallbackSms = fallback.querySelector<HTMLAnchorElement>("[data-fallback=sms]")!;
  const idleLabel = sendLabel.textContent ?? "";
  let startedAt = performance.now();
  let sending = false;

  function readFields() {
    const data = new FormData(form);
    return {
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      postcode: String(data.get("postcode") ?? ""),
      service: String(data.get("service") ?? ""),
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

  function customerMessage(quote: Quote) {
    return formatQuoteMessage(quote, intro);
  }

  function updateFallbackLinks(quote: Quote) {
    const message = customerMessage(quote);
    fallbackWhatsApp.href = buildWhatsAppUrl(whatsappNumber, message);
    fallbackSms.href = buildSmsUrl(smsNumber, message);
  }

  function setSending(value: boolean) {
    sending = value;
    sendButton.disabled = value;
    whatsappButton.disabled = value;
    sendLabel.textContent = value ? "Sending…" : idleLabel;
    form.setAttribute("aria-busy", String(value));
  }

  function showPanel(panel: HTMLElement | null) {
    success.hidden = panel !== success;
    fallback.hidden = panel !== fallback;
    panel?.focus();
  }

  async function postQuote(quote: Quote): Promise<boolean> {
    const controller = new AbortController();
    const timeout = Number(form.dataset.timeout) || DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const website = String(new FormData(form).get("website") ?? "");
      const elapsedMs = Math.round(performance.now() - startedAt);
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quote, website, elapsedMs }),
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) {
      return;
    }
    const quote = checkFields();
    if (!quote) {
      return;
    }
    showPanel(null);
    setSending(true);
    const sent = await postQuote(quote);
    setSending(false);
    if (sent) {
      form.reset();
      startedAt = performance.now();
      showPanel(success);
    } else {
      updateFallbackLinks(quote);
      showPanel(fallback);
    }
  });

  whatsappButton.addEventListener("click", () => {
    const quote = checkFields();
    if (!quote) {
      return;
    }
    window.location.assign(buildWhatsAppUrl(whatsappNumber, customerMessage(quote)));
  });

  form.addEventListener("input", () => {
    if (fallback.hidden) {
      return;
    }
    const result = validateQuoteFields(readFields());
    if (result.ok) {
      updateFallbackLinks(result.value);
    }
  });
}
