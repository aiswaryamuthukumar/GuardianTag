type Listener = () => void;

let signedIn = false;
let hydrated = false;
let snapshot = { signedIn, hydrated };
const listeners = new Set<Listener>();

function emit() {
  snapshot = { signedIn, hydrated };
  listeners.forEach((l) => l());
}

export const demoSession = {
  getSnapshot: () => snapshot,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  signIn() {
    signedIn = true;
    emit();
  },
  signOut() {
    signedIn = false;
    emit();
  },
  markHydrated() {
    hydrated = true;
    emit();
  },
};
