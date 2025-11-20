"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { subscribeUserToPush } from "./PushNotification";

export default function TestPush({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false);

    const handleTestSubscription = async () => {
        setLoading(true);
        try {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    console.log("Unsubscribing existing subscription...");
                    await subscription.unsubscribe();
                }
            }

            await subscribeUserToPush(userId);
            alert("Refreshed subscription! Now try sending a test push.");
        } catch (error) {
            console.error(error);
            alert("Error subscribing");
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerPush = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');

            let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            apiBaseUrl = apiBaseUrl.replace(/\/$/, '');

            // If the base URL already includes /api/v1, don't append it again
            const endpoint = apiBaseUrl.endsWith('/api/v1')
                ? `${apiBaseUrl}/subscriptions/test-push`
                : `${apiBaseUrl}/api/v1/subscriptions/test-push`;

            console.log("Debug: Sending request to:", endpoint);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error: ${res.status} ${errorText}`);
            }

            const data = await res.json();
            console.log("Test push result:", data);
            alert(data.message || "Test push triggered");
        } catch (error: any) {
            console.error(error);
            alert(`Failed to trigger test push: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLocalTest = async () => {
        if (!("Notification" in window)) {
            alert("Notifications not supported");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification("Local Test", { body: "This is a local test notification" });
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification("Local Test", { body: "This is a local test notification" });
            }
        } else {
            alert("Notifications are denied. Please enable them in browser settings.");
        }
    };

    const handleUnregisterSW = async () => {
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
            alert("Service Workers unregistered. Please refresh the page to reinstall.");
            window.location.reload();
        } else {
            alert("Service Workers not supported");
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm my-4">
            <h3 className="font-bold mb-2">Push Notification Debugger</h3>
            <div className="flex gap-2">
                <Button onClick={handleTestSubscription} disabled={loading} variant="outline">
                    {loading ? "..." : "1. Force Resubscribe"}
                </Button>
                <Button onClick={handleTriggerPush} disabled={loading}>
                    {loading ? "..." : "2. Send Test Push"}
                </Button>
                <Button onClick={handleLocalTest} variant="secondary">
                    3. Local Test
                </Button>
                <Button onClick={handleUnregisterSW} variant="destructive">
                    4. Reset SW
                </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Click this to ensure your browser is subscribed and the latest keys are sent to the backend.
            </p>
        </div>
    );
}
