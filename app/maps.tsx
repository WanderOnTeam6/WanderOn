import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";

declare global { interface Window { google?: any } }
type G = typeof window.google;
type Suggestion = { description: string; place_id: string };

export default function MapsPage() {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const detailsRef = useRef<any>(null);
    const detailsReqRef = useRef<any>(null);

    const [g, setG] = useState<G | null>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loadingSug, setLoadingSug] = useState(false);

    const [current, setCurrent] = useState<{
        placeId: string;
        name?: string;
        address?: string;
        location?: { lat: number; lng: number };
    } | null>(null);

    const [itinerary, setItinerary] = useState<{ placeId: string; name?: string; address?: string }[]>([]);

    const apiKey =
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
        (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY;

    // Optional: set a real Map ID later
    const mapId =
        process.env.EXPO_PUBLIC_MAP_ID ||
        (Constants?.expoConfig?.extra as any)?.MAP_ID ||
        "DEMO_MAP_ID";

    useEffect(() => {
        if (!apiKey) { console.error("Missing Google Maps JS API key"); return; }

        let cleanup = () => { };
        loadGoogleLegacy(apiKey)
            .then((google) => {
                if (!google) return;
                setG(google);

                // --- Classic constructors (no importLibrary) ---
                const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // NYC
                const m = new google.maps.Map(mapRef.current!, {
                    center: DEFAULT_CENTER,
                    zoom: 12,
                    clickableIcons: true,
                    mapTypeControl: false,
                    // Advanced style requires a valid mapId; harmless if omitted
                    ...(mapId && mapId !== "DEMO_MAP_ID" ? { mapId } : {}),
                });
                setMap(m);

                const mk = new google.maps.Marker({ map: m, position: DEFAULT_CENTER });
                setMarker(mk);

                // places lib also registers the gmp-* web components
                const placeDetails = detailsRef.current!;
                const placeReq = detailsReqRef.current!;
                placeDetails.style.visibility = "visible";

                // When widget has fetched the new place, update map/marker + current state
                const onPlaceChange = () => {
                    const p = placeDetails.place;
                    const loc = p?.location;
                    const pid = placeReq?.place as string | undefined;
                    if (!p || !loc || !pid) return;

                    mk.setPosition(loc);
                    m.panTo(loc);
                    m.setZoom(16);

                    setCurrent({
                        placeId: pid,
                        name: p.displayName?.text || undefined,
                        address: p.formattedAddress || undefined,
                        location: { lat: loc.lat(), lng: loc.lng() },
                    });
                };
                placeDetails.addEventListener("gmp-placechange", onPlaceChange);

                // Clicking a POI fills the widget; it will then fire gmp-placechange
                const clickListener = m.addListener("click", (e: any) => {
                    if (e.placeId) {
                        e.stop && e.stop();
                        placeReq.place = e.placeId;
                    }
                });

                cleanup = () => {
                    try {
                        placeDetails.removeEventListener("gmp-placechange", onPlaceChange);
                        google.maps.event.removeListener(clickListener);
                        mk.setMap(null);
                    } catch { }
                };
            })
            .catch((err) => console.error("Failed to init Maps:", err));

        return () => cleanup();
    }, [apiKey, mapId]);

    // Suggestions (new API first, fallback to legacy)
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

    const chooseSuggestion = (s: Suggestion) => {
        setQuery(s.description);
        setSuggestions([]);
        const reqEl = detailsReqRef.current;
        if (reqEl) reqEl.place = s.place_id; // widget will fetch details → gmp-placechange
    };

    const addToItinerary = () => {
        if (!current?.placeId) {
            alert("Pick a place first (click a POI or choose from search).");
            return;
        }
        setItinerary((prev) => [...prev, { placeId: current.placeId, name: current.name, address: current.address }]);
    };

    return (
        <div style={styles.page}>
            {/* TOP: Map + search + details */}
            <div style={styles.top}>
                <div style={styles.mapCol}>
                    <div ref={mapRef} style={styles.map} />
                    <div style={styles.searchWrap}>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search places"
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

                <div style={styles.panel}>
                    <gmp-place-details-compact ref={detailsRef} style={styles.details}>
                        <gmp-place-details-place-request ref={detailsReqRef}></gmp-place-details-place-request>
                    </gmp-place-details-compact>
                </div>
            </div>

            {/* BOTTOM: Add button + itinerary list */}
            <div style={styles.bottom}>
                <button onClick={addToItinerary} style={styles.addBtn}>Add to itinerary</button>
                <div style={styles.list}>
                    {itinerary.length === 0
                        ? <div style={styles.empty}>No items yet. Pick a place, then “Add to itinerary”.</div>
                        : itinerary.map((it, i) => (
                            <div key={`${it.placeId}-${i}`} style={styles.line}>
                                {i + 1}. {it.name || "(Unnamed place)"} {it.address ? `— ${it.address}` : ""}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

/* ---- robust loader: waits for google.maps.Map to be ready ---- */
function loadGoogleLegacy(apiKey: string): Promise<typeof window.google | null> {
    if (typeof window === "undefined") return Promise.resolve(null);

    // If already ready, return immediately
    if (window.google?.maps && typeof window.google.maps.Map === "function") {
        return Promise.resolve(window.google);
    }

    // If a script tag exists, wait until Map becomes available
    const waitForMap = (retries = 120): Promise<typeof window.google | null> =>
        new Promise((resolve, reject) => {
            const check = () => {
                if (window.google?.maps && typeof window.google.maps.Map === "function") {
                    resolve(window.google);
                    return;
                }
                if (retries <= 0) {
                    reject(new Error("Google Maps loaded, but google.maps.Map is not ready"));
                    return;
                }
                setTimeout(() => check(), 100); // poll every 100ms (up to ~12s)
                retries -= 1;
            };
            check();
        });

    const existing = document.getElementById("google-maps-script");
    if (existing) {
        return waitForMap();
    }

    // Inject script
    const s = document.createElement("script");
    s.id = "google-maps-script";
    s.async = true;
    s.defer = true;
    // loading=async silences the console warning; libraries=places gives us Places + web components
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&loading=async`;
    document.head.appendChild(s);

    return waitForMap();
}

/* ---- styles ---- */
const styles: Record<string, React.CSSProperties> = {
    page: { display: "grid", gridTemplateRows: "1fr auto", height: "100vh", width: "100%", background: "#f7f7f8" },
    top: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, padding: 16, boxSizing: "border-box" },
    mapCol: { position: "relative", width: "100%", height: "100%", minHeight: 360, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", background: "#fff" },
    map: { width: "100%", height: "100%" },
    searchWrap: { position: "absolute", top: 12, left: 12, right: 12 },
    input: { width: "100%", height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "white", fontSize: 14, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" },
    hint: { marginTop: 6, fontSize: 12, color: "#6b7280", background: "white", padding: "4px 8px", borderRadius: 6, display: "inline-block" },
    dropdown: { marginTop: 8, background: "white", border: "1px solid #eee", borderRadius: 10, boxShadow: "0 12px 28px rgba(0,0,0,0.12)", overflow: "hidden" },
    option: { display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "white", border: "none", cursor: "pointer", fontSize: 14 },
    panel: { width: "100%", maxHeight: "100%", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", overflow: "hidden" },
    details: { display: "block", padding: 8, background: "white", color: "#111827" },
    bottom: { borderTop: "1px solid #e5e7eb", padding: 16, display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, background: "white" },
    addBtn: { background: "#111827", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 14 },
    list: { whiteSpace: "pre-wrap", lineHeight: 1.5, paddingTop: 4 },
    line: { padding: "4px 0", borderBottom: "1px dashed #eee", fontSize: 14, color: "#111827" },
    empty: { color: "#6b7280", fontSize: 14 },
};
