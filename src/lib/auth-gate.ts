let _open: (() => void) | null = null;

export function registerAuthGateOpener(fn: () => void) {
  _open = fn;
}

export function openAuthGate() {
  _open?.();
}
