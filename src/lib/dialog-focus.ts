export function getNextDialogFocusIndex(
  currentIndex: number,
  count: number,
  backward: boolean,
): number | null {
  if (count <= 0) return null;
  if (currentIndex < 0) return backward ? count - 1 : 0;
  return (currentIndex + (backward ? -1 : 1) + count) % count;
}

export function getDialogKeyboardAction(
  key: string,
): "cancel" | "move-focus" | null {
  if (key === "Escape") return "cancel";
  if (key === "Tab") return "move-focus";
  return null;
}
