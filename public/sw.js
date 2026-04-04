const ALLOWED_ORIGIN = self.location.origin;

self.addEventListener("message", (event) => {
  if (event.origin !== ALLOWED_ORIGIN) return;
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "chalte rho 🏍️", {
      body: data.body || "You have a new notification",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
