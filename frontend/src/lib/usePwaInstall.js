import { useState, useEffect, useCallback, useRef } from "react";

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function usePwaInstall() {
  const deferredPromptRef = useRef(null);
  const [canNativeInstall, setCanNativeInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneMode();
    setIsStandalone(standalone);
    setIsIos(isIosDevice());

    if (standalone) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanNativeInstall(true);
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanNativeInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canInstall = !isStandalone && (canNativeInstall || isIos);
  const isIosInstall = isIos && !canNativeInstall && !isStandalone;

  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      deferredPromptRef.current = null;
      setCanNativeInstall(false);
    }
    return outcome === "accepted";
  }, []);

  return { canInstall, canNativeInstall, isIosInstall, isStandalone, promptInstall };
}
