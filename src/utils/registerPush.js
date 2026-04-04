import API from "../services/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerPush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const { data } = await API.get("/auth/vapid-key");
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
    await API.post("/auth/push-subscription", { subscription: sub });
    console.log("✅ Push registered");
  } catch (err) {
    console.error("Push failed:", err.message);
  }
}
