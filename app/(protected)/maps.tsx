// app/maps.tsx
import { api, clearToken } from "@/lib/api"; // uses your Authorization-bearing helper
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

declare global { interface Window { google?: any } }
type G = typeof window.google;

// Local types
type Suggestion = { description: string; place_id: string };
type TextResult = { place_id: string; name: string; address?: string; lat?: number; lng?: number };
type ItineraryItem = { placeId: string; name?: string; address?: string; location?: { lat: number; lng: number } };
type ItinerarySummary = { itineraryId: string; name: string; count?: number; updatedAt?: string };

export default function MapsPage() {
    const mapRef = useRef<HTMLDivElement | null>(null);

    // Google objects
    const [g, setG] = useState<G | null>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);

    // Markers for text-search results (we’ll clear & redraw each query)
    const resultMarkersRef = useRef<any[]>([]);

    // Autocomplete (query->suggestions)
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loadingSug, setLoadingSug] = useState(false);

    // Text Search (free-form query like “coffee near boston”)
    const [textQuery, setTextQuery] = useState("");
    const [textLoading, setTextLoading] = useState(false);
    const [textResults, setTextResults] = useState<TextResult[]>([]);

    // Current confirmed place (from Place.fetchFields)
    const [current, setCurrent] = useState<{
        placeId: string; name?: string; address?: string; location?: { lat: number; lng: number };
    } | null>(null);

    // In-memory itinerary (editable until "Save")
    const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);

    // Multi-itinerary controls
    const [itineraryId, setItineraryId] = useState<string>("default");
    const [itineraryName, setItineraryName] = useState<string>("My Trip");
    const [availableIts, setAvailableIts] = useState<ItinerarySummary[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingItList, setLoadingItList] = useState(false);
    const [loadingItItems, setLoadingItItems] = useState(false);

    // Keys (Expo)
    const apiKey =
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY;

    const mapId =
        process.env.EXPO_PUBLIC_MAP_ID ||
        (Constants?.expoConfig?.extra as any)?.MAP_ID ||
        "DEMO_MAP_ID";

    // Debug / Profile menu
    const [userId, setUserId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    // Read logged-in user id once
    useEffect(() => {
        (async () => {
            const storedId = await AsyncStorage.getItem("userId");
            setUserId(storedId);
            console.log("[DEBUG] Maps screen loaded, user ID:", storedId);
        })();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as HTMLElement | null;
            if (!t) return;
            if (!t.closest?.("#profile-menu") && !t.closest?.("#profile-avatar")) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    const onLogout = async () => {
        console.log("[DEBUG] Logging out user:", userId);
        try {
            await clearToken();
            await AsyncStorage.removeItem("userId");
        } finally {
            router.replace("/onboarding");
        }
    };

    // ---------- Google Maps boot ----------
    useEffect(() => {
        if (!apiKey) { console.error("Missing Google Maps JS API key"); return; }

        let cleanup = () => { };
        loadWithBootstrap(apiKey)
            .then(async (google) => {
                if (!google) return;
                setG(google);

                // Load libraries (maps + places) via importLibrary
                const { Map } = await google.maps.importLibrary("maps");
                await google.maps.importLibrary("places");

                const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
                const hasMapId = mapId && mapId !== "DEMO_MAP_ID";

                const m = new Map(mapRef.current!, {
                    center: DEFAULT_CENTER,
                    zoom: 12,
                    clickableIcons: true,
                    mapTypeControl: false,
                    ...(hasMapId ? { mapId } : {}),
                });
                setMap(m);

                const mk = new google.maps.Marker({ map: m, position: DEFAULT_CENTER });
                setMarker(mk);

                // Clicking a POI → fetch details (Place class) → move marker/center
                const clickListener = m.addListener("click", async (e: any) => {
                    if (!e.placeId) return;
                    e.stop && e.stop();
                    await fetchAndShowPlace(google, e.placeId, m, mk, setCurrent);
                });

                cleanup = () => {
                    try {
                        google.maps.event.removeListener(clickListener);
                        mk.setMap(null);
                        // Clear any result markers
                        resultMarkersRef.current.forEach((rm) => rm.setMap && rm.setMap(null));
                        resultMarkersRef.current = [];
                    } catch { }
                };
            })
            .catch((err) => console.error("Failed to init Maps:", err));

        return () => cleanup();
    }, [apiKey, mapId]);

    // ---------- Autocomplete ----------
    useEffect(() => {
        if (!g || !query) { setSuggestions([]); return; }

        const svc: any =
            g.maps.places?.AutocompleteSuggestionService
                ? new g.maps.places.AutocompleteSuggestionService()
                : g.maps.places?.AutocompleteService
                    ? new g.maps.places.AutocompleteService()
                    : null;
        if (!svc) return;

        setLoadingSug(true);
        const t = setTimeout(() => {
            if (svc.getSuggestions) {
                svc.getSuggestions({ input: query }, (res: any[] | null) => {
                    setSuggestions((res || []).map((r: any) => ({
                        description: r.formattedSuggestion || r.description || "",
                        place_id: r.placeId || r.place_id,
                    })));
                    setLoadingSug(false);
                });
            } else {
                svc.getPlacePredictions({ input: query }, (res: any[] | null) => {
                    setSuggestions((res || []).map((r: any) => ({ description: r.description, place_id: r.place_id })));
                    setLoadingSug(false);
                });
            }
        }, 250);

        return () => { clearTimeout(t); setLoadingSug(false); };
    }, [g, query]);

    const chooseSuggestion = async (s: Suggestion) => {
        setQuery(s.description);
        setSuggestions([]);
        if (!g || !map || !marker) return;
        await fetchAndShowPlace(g, s.place_id, map, marker, setCurrent);
    };

    // ---------- Text Search ----------
    const runTextSearch = async () => {
        if (!g || !map) return;
        const google = g;

        // Clear previous result markers
        resultMarkersRef.current.forEach((rm) => rm.setMap && rm.setMap(null));
        resultMarkersRef.current = [];
        setTextResults([]);
        setTextLoading(true);

        try {
            const service = new google.maps.places.PlacesService(map);
            const req: any = { query: textQuery }; // add { location, radius } if desired

            service.textSearch(req, async (results: any[], status: any) => {
                setTextLoading(false);
                if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
                    setTextResults([]);
                    return;
                }

                const trimmed: TextResult[] = results.slice(0, 12).map((r: any) => ({
                    place_id: r.place_id,
                    name: r.name || "(Unnamed place)",
                    address: r.formatted_address,
                    lat: r.geometry?.location?.lat?.(),
                    lng: r.geometry?.location?.lng?.(),
                }));

                setTextResults(trimmed);

                const bounds = new google.maps.LatLngBounds();
                trimmed.forEach((r, idx) => {
                    if (r.lat != null && r.lng != null) {
                        const pos = { lat: r.lat, lng: r.lng };
                        bounds.extend(pos);
                        const rm = new google.maps.Marker({
                            map,
                            position: pos,
                            label: `${(idx + 1)}`,
                        });
                        rm.addListener("click", async () => {
                            await fetchAndShowPlace(google, r.place_id, map, marker, setCurrent);
                        });
                        resultMarkersRef.current.push(rm);
                    }
                });
                if (!bounds.isEmpty()) map.fitBounds(bounds);
            });
        } catch (e) {
            setTextLoading(false);
            console.error("Text search failed:", e);
        }
    };

    // ---------- Add item (local) ----------
    const addToItinerary = () => {
        if (!current?.placeId) {
            alert("Pick a place first (click a POI, choose from autocomplete, or click a text-search result).");
            return;
        }
        setItinerary((prev) => [...prev, {
            placeId: current.placeId,
            name: current.name,
            address: current.address,
            location: current.location,
        }]);
    };

    // ---------- Persistence helpers using your api() ----------
    async function listItineraries(): Promise<ItinerarySummary[]> {
        return api("/itinerary"); // GET
    }
    async function getItineraryItems(id: string): Promise<ItineraryItem[]> {
        return api(`/itinerary/${encodeURIComponent(id)}`); // GET
    }
    async function saveItineraryItems(id: string, items: ItineraryItem[], name?: string): Promise<void> {
        await api(`/itinerary/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, items }),
        });
    }

    // ---------- Boot: load list and current itinerary ----------
    useEffect(() => {
        (async () => {
            try {
                setLoadingItList(true);
                const list = await listItineraries();
                setAvailableIts(list);

                // Load selected itinerary's items (or empty if new)
                setLoadingItItems(true);
                const items = await getItineraryItems(itineraryId);
                setItinerary(items);
            } catch (e) {
                // If user has none yet, we just keep an empty local itinerary
                setItinerary([]);
            } finally {
                setLoadingItList(false);
                setLoadingItItems(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onChangeItinerary = async (id: string) => {
        setItineraryId(id);
        try {
            setLoadingItItems(true);
            const items = await getItineraryItems(id);
            setItinerary(items);
        } catch {
            setItinerary([]); // new/empty
        } finally {
            setLoadingItItems(false);
        }
    };

    const onSave = async () => {
        if (!itineraryId || itineraryId.trim() === "") {
            alert("Please set an itinerary id (e.g., spring-break-2026).");
            return;
        }
        try {
            setSaving(true);
            console.log("[DEBUG] Saving itinerary for user:", userId, {
                itineraryId: itineraryId.trim(),
                name: itineraryName,
                items: itinerary,
            });
            await saveItineraryItems(itineraryId.trim(), itinerary, itineraryName);
            // Optionally refresh list so counts/updatedAt update
            const list = await listItineraries();
            setAvailableIts(list);
        } catch (e) {
            alert("Failed to save itinerary");
        } finally {
            setSaving(false);
        }
    };

    // ---------- UI ----------
    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.headerBar}>
                <div style={styles.headerLeft}>
                    {/* Avatar (top-left) */}
                    <button
                        id="profile-avatar"
                        onClick={() => setMenuOpen((v) => !v)}
                        style={styles.avatarBtn}
                        title={userId ? `User: ${userId}` : "Profile"}
                    >
                        <span style={styles.avatarText}>
                            {(userId?.slice(-2) || "U").toUpperCase()}
                        </span>
                    </button>

                    <h1 style={styles.headerTitle}>Itinerary Builder</h1>
                </div>

                {/* Itinerary controls (ID selector + Name + Save) */}
                <div style={styles.controlsRow}>
                    <label style={styles.label}>Itinerary</label>
                    <select
                        value={itineraryId}
                        onChange={(e) => onChangeItinerary(e.target.value)}
                        style={styles.select}
                        disabled={loadingItList}
                    >
                        {/* include current id if not in list */}
                        {!availableIts.some((x) => x.itineraryId === itineraryId) && (
                            <option value={itineraryId}>{itineraryId}</option>
                        )}
                        {availableIts.map((it) => (
                            <option key={it.itineraryId} value={it.itineraryId}>
                                {it.name || it.itineraryId}
                            </option>
                        ))}
                        <option value="__new">+ New…</option>
                    </select>

                    {/* Inline new id input when "__new" is chosen */}
                    {itineraryId === "__new" && (
                        <input
                            placeholder="new-itinerary-id"
                            onChange={(e) => setItineraryId(e.target.value.trim())}
                            style={styles.smallInput}
                        />
                    )}

                    <label style={styles.label}>Name</label>
                    <input
                        value={itineraryName}
                        onChange={(e) => setItineraryName(e.target.value)}
                        placeholder="My Trip"
                        style={styles.smallInput}
                    />

                    <button onClick={onSave} disabled={saving} style={styles.saveBtn}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>

                {/* Dropdown (under avatar) */}
                {menuOpen && (
                    <div id="profile-menu" style={styles.dropdownMenu}>
                        <div style={styles.menuHeader}>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>Signed in</div>
                            <div style={{ fontSize: 12, wordBreak: "break-all" }}>
                                {userId || "unknown"}
                            </div>
                        </div>
                        <button onClick={onLogout} style={styles.menuItem}>Log out</button>
                    </div>
                )}
            </div>

            {/* TOP: map + right panel */}
            <div style={styles.top}>
                <div style={styles.mapCol}>
                    <div ref={mapRef} style={styles.map} />
                    {/* Autocomplete search overlay */}
                    <div style={styles.searchWrap}>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search places (autocomplete)"
                            style={styles.input}
                        />
                        {loadingSug && <div style={styles.hint}>Searching…</div>}
                        {suggestions.length > 0 && (
                            <div style={styles.dropdown}>
                                {suggestions.map((s) => (
                                    <button key={s.place_id} style={styles.option} onClick={() => chooseSuggestion(s)}>
                                        {s.description}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel: Selected + Text Search */}
                <div style={styles.panel}>
                    <div style={styles.detailsBox}>
                        <div style={styles.detailsTitle}>Selected place</div>
                        {current ? (
                            <>
                                <div style={styles.detailsLine}><strong>Name:</strong> {current.name || "(Unnamed place)"}</div>
                                <div style={styles.detailsLine}><strong>Address:</strong> {current.address || "—"}</div>
                                <div style={styles.detailsLine}><strong>Place ID:</strong> {current.placeId}</div>
                            </>
                        ) : (
                            <div style={styles.empty}>Pick a place (map click, autocomplete, or text search).</div>
                        )}
                    </div>

                    {/* Text Search box */}
                    <div style={{ padding: 12, borderTop: "1px solid #eee" }}>
                        <div style={styles.detailsTitle}>Text Search</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                value={textQuery}
                                onChange={(e) => setTextQuery(e.target.value)}
                                placeholder='e.g. "best tacos near dallas"'
                                style={{ ...styles.input, boxShadow: "none", height: 40 }}
                            />
                            <button onClick={runTextSearch} disabled={!textQuery || textLoading} style={styles.goBtn}>
                                {textLoading ? "…" : "Go"}
                            </button>
                        </div>

                        {/* Text results */}
                        <div style={{ marginTop: 10, maxHeight: 260, overflow: "auto" }}>
                            {textResults.length === 0 ? (
                                <div style={styles.empty}>No results yet.</div>
                            ) : (
                                textResults.map((r, i) => (
                                    <button
                                        key={r.place_id}
                                        style={styles.resultRow}
                                        onClick={() => fetchAndShowPlace(g!, r.place_id, map, marker, setCurrent)}
                                    >
                                        <span style={styles.resultIndex}>{i + 1}.</span>
                                        <span>
                                            <div style={{ fontWeight: 600 }}>{r.name}</div>
                                            {r.address && <div style={{ fontSize: 12, color: "#6b7280" }}>{r.address}</div>}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM: add + itinerary list (button fixed, list scrolls) */}
            <div style={styles.bottom}>
                <button onClick={addToItinerary} style={styles.addBtn}>Add to itinerary</button>
                <div style={styles.list}>
                    {loadingItItems ? (
                        <div style={styles.empty}>Loading itinerary…</div>
                    ) : itinerary.length === 0 ? (
                        <div style={styles.empty}>No items yet. Pick a place, then “Add to itinerary”.</div>
                    ) : (
                        itinerary.map((it, i) => (
                            <div key={`${it.placeId}-${i}`} style={styles.line}>
                                {i + 1}. {it.name || "(Unnamed place)"} {it.address ? `— ${it.address}` : ""}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------- Fetch details via Place class + fields, update map/marker ---------- */
async function fetchAndShowPlace(
    google: G,
    placeId: string,
    map: any,
    marker: any,
    setCurrent: React.Dispatch<React.SetStateAction<{
        placeId: string; name?: string; address?: string; location?: { lat: number; lng: number }
    } | null>>
) {
    const { Place } = await google.maps.importLibrary("places");
    const p = new (Place as any)({ id: placeId });

    await p.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });

    const name = p.displayName?.text ?? "(Unnamed place)";
    const address = p.formattedAddress ?? "";
    const loc = p.location;

    if (loc) {
        const pt = { lat: loc.lat(), lng: loc.lng() };
        if (marker?.setPosition) marker.setPosition(pt); else marker.position = pt;
        map?.panTo(pt);
        map?.setZoom(16);
    }

    setCurrent({
        placeId,
        name,
        address,
        location: loc ? { lat: loc.lat(), lng: loc.lng() } : undefined,
    });
}

/* ---------- Bootstrap loader (recommended by Google) ---------- */
function loadWithBootstrap(key: string): Promise<G> {
    if (typeof window === "undefined") return Promise.resolve(null as any);
    if (window.google?.maps?.importLibrary) return Promise.resolve(window.google);

    return new Promise((resolve, reject) => {
        const existing = document.getElementById("gmaps-bootstrap");
        if (!existing) {
            const s = document.createElement("script");
            s.id = "gmaps-bootstrap";
            s.innerHTML = `
        (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",
        q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),
        r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await
        (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)
        e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
        e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;
        d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=
        m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));
        d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&
        u().then(()=>d[l](f,...n))})({ key: "${key}", v: "weekly" });
      `;
            s.onerror = () => reject(new Error("Failed to bootstrap Google Maps"));
            document.head.appendChild(s);
        }
        const tick = () =>
            window.google?.maps?.importLibrary ? resolve(window.google) : setTimeout(tick, 50);
        tick();
    });
}

/* ---------- styles ---------- */
const styles: Record<string, React.CSSProperties> = {
    page: {
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        height: "100vh",
        width: "100%",
        background: "#f7f7f8",
    },

    // header
    headerBar: {
        position: "relative",
        zIndex: 10,
        width: "100%",
        padding: "14px 16px",
        background: "#111827",
        color: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 12 },
    headerTitle: { fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 0 },

    // avatar + dropdown
    avatarBtn: {
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.3)",
        background: "linear-gradient(180deg,#f3f4f6,#d1d5db)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", padding: 0,
    },
    avatarText: { fontSize: 12, fontWeight: 700, color: "#111827" },
    dropdownMenu: {
        position: "absolute",
        top: 56, left: 16, // under avatar, top-left
        width: 220,
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
        overflow: "hidden",
    },
    menuHeader: { padding: "10px 12px", borderBottom: "1px solid #eee", background: "#f9fafb" },
    menuItem: {
        width: "100%", textAlign: "left",
        padding: "10px 12px", background: "white",
        border: "none", cursor: "pointer", fontSize: 14,
    },

    // itinerary controls row (right side of header)
    controlsRow: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 10,
    },
    label: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
    select: {
        height: 36,
        borderRadius: 8,
        border: "1px solid #d1d5db",
        padding: "0 8px",
        background: "white",
    },
    smallInput: {
        height: 36,
        borderRadius: 8,
        border: "1px solid #d1d5db",
        padding: "0 8px",
        background: "white",
        minWidth: 160,
    },
    saveBtn: {
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: 8,
        height: 36,
        padding: "0 14px",
        cursor: "pointer",
    },

    // main
    top: { display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, padding: 16, boxSizing: "border-box" },
    mapCol: { position: "relative", width: "100%", height: "100%", minHeight: 360, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", background: "#fff" },
    map: { width: "100%", height: "100%" },
    searchWrap: { position: "absolute", top: 12, left: 12, right: 12 },
    input: { width: "100%", height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", fontSize: 14, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
    dropdown: { marginTop: 8, background: "white", border: "1px solid #eee", borderRadius: 10, boxShadow: "0 12px 28px rgba(0,0,0,0.12)", overflow: "hidden" },
    option: { display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "white", border: "none", cursor: "pointer", fontSize: 14 },
    hint: { marginTop: 6, fontSize: 12, color: "#6b7280", background: "white", padding: "4px 8px", borderRadius: 6, display: "inline-block" },

    panel: { width: "100%", maxHeight: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", overflow: "hidden", display: "flex", flexDirection: "column" },
    detailsBox: { padding: 12 },
    detailsTitle: { fontWeight: 600, marginBottom: 8 },
    detailsLine: { padding: "4px 0", fontSize: 14, color: "#111827" },
    empty: { color: "#6b7280", fontSize: 14 },

    // bottom fixed height w/ scrollable list
    bottom: {
        borderTop: "1px solid #e5e7eb",
        padding: 16,
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 16,
        background: "white",
        alignItems: "start",
        maxHeight: "25vh",
    },
    addBtn: {
        background: "#111827",
        color: "white",
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        cursor: "pointer",
        fontSize: 14,
        height: 44,
    },
    list: {
        whiteSpace: "pre-wrap",
        lineHeight: 1.5,
        paddingTop: 4,
        overflowY: "auto",
        maxHeight: "20vh",
    },
    line: { padding: "4px 0", borderBottom: "1px dashed #eee", fontSize: 14, color: "#111827" },

    goBtn: { background: "#111827", color: "white", border: "none", borderRadius: 8, padding: "0 14px", height: 40, cursor: "pointer" },
    resultRow: { display: "flex", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", background: "white", border: "1px solid #eee", borderRadius: 8, marginBottom: 6, cursor: "pointer" },
    resultIndex: { width: 18, display: "inline-block", color: "#6b7280" },
};
