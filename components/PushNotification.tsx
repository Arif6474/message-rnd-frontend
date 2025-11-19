// utils/pushNotifications.ts or inside ChatSection
const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };
  
  export const subscribeUserToPush = async (userId: string) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push not supported");
      return;
    }
  
    try {
      // Get access token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error("No access token found. User must be authenticated to subscribe to push notifications.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
  
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key is not configured. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your environment variables.");
        return;
      }
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
  
      // Get API base URL from environment variable
      // Handle both cases: env var with or without /api/v1
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Remove trailing slash if present
      apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
      // Append /api/v1 if not already present
      if (!apiBaseUrl.endsWith('/api/v1')) {
        apiBaseUrl = `${apiBaseUrl}/api/v1`;
      }
      const apiUrl = `${apiBaseUrl}/subscriptions/save-subscription`;
  
      // Send subscription to backend with authentication
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription, // Only send subscription, userId is now obtained from the authenticated token
        }),
      });
  
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        if (response.status === 401) {
          console.error("Authentication required. Please log in again.");
          // Optionally redirect to login or refresh token
        } else if (response.status === 400) {
          console.error("Invalid subscription:", error.message || error.error);
        } else {
          console.error("Failed to save subscription:", error.message || error.error || 'Unknown error');
        }
        return;
      }
  
      console.log("Push subscription saved successfully");
    } catch (err) {
      console.error("Failed to subscribe:", err);
    }
  };

