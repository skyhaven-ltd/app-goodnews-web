export function initMenu(button: HTMLButtonElement, panel: HTMLElement) {
  const desktop = window.matchMedia("(min-width: 48rem)");

  function isOpen() {
    return button.getAttribute("aria-expanded") === "true";
  }

  function setOpen(open: boolean) {
    button.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  }

  button.addEventListener("click", () => setOpen(!isOpen()));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  panel.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setOpen(false);
    }
  });

  desktop.addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
}
