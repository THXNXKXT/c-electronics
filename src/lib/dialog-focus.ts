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

type DialogFocusTarget = {
  isConnected: boolean;
  matches: (selectors: string) => boolean;
};

function isAvailableDialogFocusTarget(
  target: DialogFocusTarget | null,
): target is DialogFocusTarget {
  return Boolean(
    target?.isConnected &&
      !target.matches(':disabled,[aria-disabled="true"],[inert] *'),
  );
}

export function chooseDialogRestoreTarget<T extends DialogFocusTarget>(
  previouslyFocused: T | null,
  confirmedFallback: T | null,
  confirmed: boolean,
): T | null {
  const candidates = confirmed
    ? [confirmedFallback, previouslyFocused]
    : [previouslyFocused, confirmedFallback];
  return candidates.find(isAvailableDialogFocusTarget) ?? null;
}
