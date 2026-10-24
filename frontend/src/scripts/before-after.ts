export function initBeforeAfter(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>("[data-before-after-input]");
  if (!input) {
    return;
  }
  const slider = input;

  function show() {
    root.style.setProperty("--split", `${slider.value}%`);
  }

  function moveTo(clientX: number) {
    const rect = root.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    slider.value = String(Math.round(ratio * 100));
    show();
  }

  slider.addEventListener("input", show);

  root.addEventListener("pointerdown", (event) => {
    root.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  });

  root.addEventListener("pointermove", (event) => {
    if (root.hasPointerCapture(event.pointerId)) {
      moveTo(event.clientX);
    }
  });

  show();
}
