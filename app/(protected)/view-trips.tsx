// app/(protected)/view-trips.tsx
import { api, clearToken } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

type ItinerarySummary = { itineraryId: string; name?: string; count?: number; updatedAt?: string };
type ItineraryItem = { placeId: string; name?: string; address?: string };

export default function ViewTrips() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [loadingList, setLoadingList] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Map of itineraryId -> items
    const [itineraries, setItineraries] = useState<Record<string, { name: string; items: ItineraryItem[] }>>({});
    const [order, setOrder] = useState<string[]>([]); // display order

    useEffect(() => {
        (async () => {
            const id = await AsyncStorage.getItem("userId");
            setUserId(id);
            console.log("[DEBUG] ViewTrips loaded; userId:", id);
        })();
    }, []);

    useEffect(() => {
        // close dropdown if clicking outside (web)
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            if (!t) return;
            if (!t.closest?.("#vt-menu") && !t.closest?.("#vt-avatar")) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const onLogout = async () => {
        console.log("[DEBUG] ViewTrips logout; userId:", userId);
        try {
            await clearToken();
            await AsyncStorage.removeItem("userId");
        } finally {
            router.replace("/onboarding");
        }
    };

    // Load all itineraries + their items
    useEffect(() => {
        (async () => {
            try {
                setLoadingList(true);
                setError(null);

                const list: ItinerarySummary[] = await api("/itinerary"); // GET summaries
                // Keep their order by updatedAt desc if provided; else as-is
                const sorted = [...list].sort((a, b) => {
                    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                    return tb - ta;
                });

                setOrder(sorted.map((s) => s.itineraryId));

                // Fetch items for each itinerary
                setLoadingItems(true);
                const entries = await Promise.all(
                    sorted.map(async (s) => {
                        try {
                            const items = await api(`/itinerary/${encodeURIComponent(s.itineraryId)}`); // GET items
                            return [s.itineraryId, { name: s.name || s.itineraryId, items: items as ItineraryItem[] }] as const;
                        } catch (e) {
                            console.warn("[DEBUG] Failed to load items for", s.itineraryId, e);
                            return [s.itineraryId, { name: s.name || s.itineraryId, items: [] }] as const;
                        }
                    })
                );

                const dict: Record<string, { name: string; items: ItineraryItem[] }> = {};
                for (const [id, val] of entries) dict[id] = val;
                setItineraries(dict);
            } catch (e: any) {
                console.error(e);
                setError(e?.message || "Failed to load itineraries");
            } finally {
                setLoadingList(false);
                setLoadingItems(false);
            }
        })();
    }, []);

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        id="vt-avatar"
                        onClick={() => setMenuOpen((v) => !v)}
                        style={styles.avatarBtn}
                        title={userId ? `User: ${userId}` : "Profile"}
                    >
                        <span style={styles.avatarText}>{(userId?.slice(-2) || "U").toUpperCase()}</span>
                    </button>
                    <h1 style={styles.title}>Your Trips</h1>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button style={styles.secondaryBtn} onClick={() => router.replace("/logged-in")}>Home</button>
                    <button style={styles.primaryBtn} onClick={() => router.replace("/maps")}>Create New Trip</button>
                </div>

                {menuOpen && (
                    <div id="vt-menu" style={styles.menu}>
                        <div style={styles.menuHeader}>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>Signed in</div>
                            <div style={{ fontSize: 12, wordBreak: "break-all", color: "#111827" }}>{userId || "unknown"}</div>
                        </div>
                        <button onClick={onLogout} style={styles.menuItem}>Log out</button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div style={styles.body}>
                {loadingList ? (
                    <div style={styles.muted}>Loading trips…</div>
                ) : error ? (
                    <div style={{ ...styles.muted, color: "#b91c1c" }}>{error}</div>
                ) : order.length === 0 ? (
                    <div style={styles.empty}>
                        You don’t have any itineraries yet.{" "}
                        <button style={styles.linkBtn} onClick={() => router.replace("/maps")}>Create one</button>.
                    </div>
                ) : (
                    <div style={styles.listWrap}>
                        {order.map((id) => {
                            const it = itineraries[id];
                            const name = it?.name || id;
                            const items = it?.items || [];
                            return (
                                <div key={id} style={styles.card}>
                                    <div style={styles.cardTitle}>{name}</div>
                                    {loadingItems ? (
                                        <div style={styles.muted}>Loading places…</div>
                                    ) : items.length === 0 ? (
                                        <div style={styles.muted}>No places yet.</div>
                                    ) : (
                                        <ol style={styles.ol}>
                                            {items.map((p, idx) => (
                                                <li key={`${p.placeId}-${idx}`} style={styles.li}>
                                                    <span style={{ fontWeight: 600 }}>{p.name || "(Unnamed place)"}</span>
                                                    {p.address ? <span style={styles.addr}> — {p.address}</span> : null}
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: { display: "grid", gridTemplateRows: "auto 1fr", height: "100vh", background: "#f7f7f8" },
    header: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: "#111827",
        color: "white",
        padding: "14px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 10,
    },
    title: { margin: 0, fontSize: 18, fontWeight: 600 },
    primaryBtn: {
        background: "#2563eb", color: "white", border: "none",
        borderRadius: 8, height: 36, padding: "0 14px", cursor: "pointer",
    },
    secondaryBtn: {
        background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 8, height: 36, padding: "0 14px", cursor: "pointer",
    },
    avatarBtn: {
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.3)",
        background: "linear-gradient(180deg,#f3f4f6,#d1d5db)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0,
    },
    avatarText: { fontSize: 12, fontWeight: 700, color: "#111827" },
    menu: {
        position: "absolute", top: 56, left: 16, width: 220,
        background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)", overflow: "hidden",
    },
    menuHeader: { padding: "10px 12px", borderBottom: "1px solid #eee", background: "#f9fafb" },
    menuItem: {
        width: "100%", textAlign: "left", padding: "10px 12px",
        background: "white", border: "none", cursor: "pointer", fontSize: 14,
    },

    body: { padding: 16, overflow: "auto" },
    listWrap: { display: "grid", gap: 12, maxWidth: 900, margin: "0 auto" },
    card: {
        background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
    },
    cardTitle: { fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#111827" },
    ol: { margin: 0, paddingLeft: 18 },
    li: { padding: "6px 0", color: "#111827" },
    addr: { color: "#6b7280" },
    muted: { color: "#6b7280", fontSize: 14 },
    empty: {
        maxWidth: 700,
        margin: "40px auto",
        background: "white",
        border: "1px dashed #d1d5db",
        color: "#374151",
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
    },
    linkBtn: {
        background: "transparent", color: "#2563eb", border: "none",
        cursor: "pointer", textDecoration: "underline",
    },
};
