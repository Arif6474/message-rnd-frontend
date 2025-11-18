// public/sw.js
self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
  
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