import { useSyncExternalStore } from "react";
import { subscribe } from "./mock-data";

// Stable, incrementing version. MUST NOT use Date.now() in getSnapshot —
// that returns a new value on every read and causes an infinite render loop.
let version = 0;
subscribe(() => {
  version += 1;
});

export function useStoreVersion() {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => version,
    () => 0,
  );
}
