import Constants from "expo-constants";
import React from "react";

export default function EnvProbe() {
    const p = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const extra = (Constants?.expoConfig?.extra as any) || {};
    return (
        <div style={{ padding: 16, fontFamily: "monospace" }}>
            <h3>Env probe</h3>
            <pre>process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = {String(p)}</pre>
            <pre>extra.GOOGLE_MAPS_API_KEY = {String(extra.GOOGLE_MAPS_API_KEY)}</pre>
            <pre>extra.MAP_ID = {String(extra.MAP_ID)}</pre>
        </div>
    );
}
