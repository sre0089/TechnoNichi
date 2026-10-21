// A closing dialog may finish after the user has already chosen another field.
// Restore only while focus is still unclaimed; never steal the next keystroke.
export function restoreUnclaimedFocus(target: () => HTMLElement | null) {
  const unclaimed = () => {
    const active = document.activeElement;
    return (
      !active || active === document.body || !!active.closest('[role="dialog"]')
    );
  };
  if (!unclaimed()) return;
  requestAnimationFrame(() => {
    if (unclaimed()) target()?.focus({ preventScroll: true });
  });
}
