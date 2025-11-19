// public/sw.js
self.addEventListener("push", (event) => {
    let data = {};
    
    // Handle both JSON and plain string payloads
    if (event.data) {
      try {
        // Try to parse as JSON (from backend)
        data = event.data.json();
      } catch (e) {
        // If parsing fails, treat as plain string (from DevTools testing)
        const text = event.data.text();
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
  
    event.waitUntil(self.registration.showNotification(title, options));
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(clients.openWindow(url));
  });