export type UploadActivityTracker = {
  start: () => void;
  finish: () => void;
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
