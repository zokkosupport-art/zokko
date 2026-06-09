import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setStatus("logged_out");
      return;
    }
    if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const reg = await getServiceWorkerRegistration();
      if (!reg) {
        setStatus("unsupported");
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "enabled" : Notification.permission === "granted" ? "disabled" : "prompt");
    } catch {
      setStatus("unsupported");
    }
  }, [user]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const subscribe = useCallback(async () => {
    if (!user) return false;
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.get("/notifications/push/vapid-public-key");
      if (!data?.publicKey) {
        setStatus("unavailable");
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "prompt");
        return false;
      }

      const reg = await getServiceWorkerRegistration();
      if (!reg) {
        setStatus("unsupported");
        return false;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });
      }

      const json = sub.toJSON();
      await api.post("/notifications/push/subscribe", {
        endpoint: json.endpoint,
        keys: json.keys,
        expirationTime: json.expirationTime ?? null,
      });

      setStatus("enabled");
      return true;
    } catch (e) {
      setError(formatApiError(e));
      await refreshStatus();
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, refreshStatus]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await api.delete("/notifications/push/unsubscribe", { data: { endpoint } });
      }
      setStatus(Notification.permission === "denied" ? "denied" : "disabled");
      return true;
    } catch (e) {
      setError(formatApiError(e));
      await refreshStatus();
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, refreshStatus]);

  const toggle = useCallback(async () => {
    if (status === "enabled") return unsubscribe();
    return subscribe();
  }, [status, subscribe, unsubscribe]);

  return {
    status,
    busy,
    error,
    isSupported: status !== "unsupported" && status !== "logged_out",
    isEnabled: status === "enabled",
    subscribe,
    unsubscribe,
    toggle,
    refreshStatus,
  };
}
