type Listener = () => void;

let signedIn = false;
let snapshot = { signedIn };
const listeners = new Set<Listener>();

function emit() {
  snapshot = { signedIn };
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
};
