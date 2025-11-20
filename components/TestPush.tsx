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

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm my-4">
            <h3 className="font-bold mb-2">Push Notification Debugger</h3>
            <div className="flex gap-2">
                <Button onClick={handleTestSubscription} disabled={loading}>
                    {loading ? "Subscribing..." : "Resubscribe / Update Permission"}
                </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Click this to ensure your browser is subscribed and the latest keys are sent to the backend.
            </p>
        </div>
    );
}
