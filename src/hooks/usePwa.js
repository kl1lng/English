import { useCallback, useEffect, useState } from "react";

// Registers the service worker (production builds only) and exposes the install prompt and the
// "new version is ready" state.
export function usePwa() {
  const [installEvent, setInstallEvent] = useState(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [waiting, setWaiting] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstallEvent(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
    navigator.serviceWorker
      .register(`/sw.js?v=${__BUILD_ID__}`)
      .then((registration) => {
        const track = (worker) => {
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(worker);
              setUpdateReady(true);
            }
          });
        };
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaiting(registration.waiting);
          setUpdateReady(true);
        }
        registration.addEventListener("updatefound", () => registration.installing && track(registration.installing));
      })
      .catch(() => {});
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice.catch(() => {});
    setInstallEvent(null);
  }, [installEvent]);

  const applyUpdate = useCallback(() => waiting?.postMessage({ type: "SKIP_WAITING" }), [waiting]);

  return { canInstall: Boolean(installEvent), install, updateReady, applyUpdate };
}
