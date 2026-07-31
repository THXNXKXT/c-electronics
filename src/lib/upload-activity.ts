export type UploadActivityTracker = {
  start: () => void;
  finish: () => void;
  dispose: () => void;
};

export type UploadBusyCounter = {
  setSourceActive: (source: string, active: boolean) => void;
  dispose: () => void;
};

export function createUploadActivityTracker(
  notify: (uploading: boolean) => void,
): UploadActivityTracker {
  let active = false;
  let disposed = false;

  return {
    start() {
      if (disposed || active) return;
      active = true;
      notify(true);
    },
    finish() {
      if (disposed || !active) return;
      active = false;
      notify(false);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (!active) return;
      active = false;
      notify(false);
    },
  };
}

export function createUploadBusyCounter(
  notify: (uploading: boolean) => void,
): UploadBusyCounter {
  const activeSources = new Set<string>();
  let disposed = false;

  return {
    setSourceActive(source, active) {
      if (disposed) return;
      const wasBusy = activeSources.size > 0;
      if (active) activeSources.add(source);
      else activeSources.delete(source);
      const isBusy = activeSources.size > 0;
      if (wasBusy !== isBusy) notify(isBusy);
    },
    dispose() {
      disposed = true;
      activeSources.clear();
    },
  };
}
