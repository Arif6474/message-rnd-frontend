"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { subscribeUserToPush } from "./PushNotification";

export default function TestPush({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false);

    const handleTestSubscription = async () => {
        setLoading(true);
        try {
            await subscribeUserToPush(userId);
            alert("Subscription attempt finished. Check console for details.");
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

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm my-4">
            <h3 className="font-bold mb-2">Push Notification Debugger</h3>
            <div className="flex gap-2">
                <Button onClick={handleTestSubscription} disabled={loading} variant="outline">
                    {loading ? "..." : "1. Resubscribe"}
                </Button>
                <Button onClick={handleTriggerPush} disabled={loading}>
                    {loading ? "..." : "2. Send Test Push"}
                </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Click this to ensure your browser is subscribed and the latest keys are sent to the backend.
            </p>
        </div>
    );
}
