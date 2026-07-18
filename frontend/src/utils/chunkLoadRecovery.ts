/**
 * Recover from Vite "Failed to fetch dynamically imported module" after deploys.
 * Old tabs keep a shell that references deleted /assets/*-HASH.js chunks.
 * One forced reload picks up the new index.html + hashes.
 */
const RELOAD_KEY = 'urutix:chunk-reload';

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  );
}

export function setupChunkLoadRecovery(): void {
  const tryReload = (error: unknown) => {
    if (!isChunkLoadError(error)) return;

    const last = sessionStorage.getItem(RELOAD_KEY);
    const now = Date.now();
    // Avoid infinite reload loops
    if (last && now - Number(last) < 15_000) return;

    sessionStorage.setItem(RELOAD_KEY, String(now));
    window.location.reload();
  };

  window.addEventListener('unhandledrejection', (event) => {
    tryReload(event.reason);
  });

  window.addEventListener('error', (event) => {
    tryReload(event.error || event.message);
  });
}
