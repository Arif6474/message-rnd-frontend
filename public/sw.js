// public/sw.js
self.addEventListener("push", (event) => {
  console.log("🔔 [SW] Push event received!", event);
  let data = {};

  // Handle both JSON and plain string payloads
  if (event.data) {
    try {
      // Try to parse as JSON (from backend)
      data = event.data.json();
      console.log("🔔 [SW] Parsed JSON data:", data);
    } catch (e) {
      // If parsing fails, treat as plain string (from DevTools testing)
      const text = event.data.text();
      console.log("🔔 [SW] Parsed text data:", text);
      data = {
        title: "New Notification",
        body: text,
      };
    }
  }

  const title = data.title || "New Mention";
  const options = {
    body: data.body || "You were mentioned in a project",
    icon: data.icon || "/logo192.png",
    badge: data.badge || "/badge.png",
    data: data.data || { url: "/" },
    tag: data.tag || "mention",
  };

  console.log("🔔 [SW] Showing notification:", title, options);

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => console.log("🔔 [SW] Notification shown successfully"))
      .catch((err) => console.error("🔔 [SW] Notification show failed:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          // Check if the client url matches or is the base of the app
          // You might want to refine this matching logic
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
