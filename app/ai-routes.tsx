// app/ai-routes.tsx
import { api } from "@/lib/api";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Types */
type G = typeof window.google;
type ItineraryItem = {
    placeId: string;
    name?: string;
    address?: string;
    location?: { lat: number; lng: number };
};

/** Google key from Expo env/extra */
const GOOGLE_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (Constants?.expoConfig?.extra as any)?.GOOGLE_MAPS_API_KEY;

export default function AIRoutesPage() {
    const { itineraryId } = useLocalSearchParams<{ itineraryId: string }>();
    const router = useRouter();

    // Raw items from API (do not mutate this to avoid loops)
    const [items, setItems] = useState<ItineraryItem[]>([]);
    // Resolved items with lat/lng present; use this for map + routing
    const [resolvedItems, setResolvedItems] = useState<ItineraryItem[]>([]);
    const [tripName, setTripName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Google map refs/state
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [g, setG] = useState<G | null>(null);
    const [map, setMap] = useState<any>(null);
    const markersRef = useRef<any[]>([]);
    const mapCreatedRef = useRef(false);
    const directionsRendererRef = useRef<any | null>(null);

    // Controls
    const [mode, setMode] = useState<"DRIVING" | "WALKING" | "BICYCLING">("DRIVING");
    const [startIndex, setStartIndex] = useState<number>(0);

    // Results
    const [order, setOrder] = useState<number[]>([]);
    const [legDurations, setLegDurations] = useState<number[]>([]);
    const totalDuration = useMemo(() => legDurations.reduce((a, b) => a + b, 0), [legDurations]);

    // Debounce token for matrix calls
    const computeTokenRef = useRef(0);
    const [isComputing, setIsComputing] = useState(false);

    /** Bootstrap Google Maps JS + preload libraries */
    useEffect(() => {
        if (!GOOGLE_KEY) {
            setErrorMsg("Missing Google Maps API Key");
            setLoading(false);
            return;
        }
        let cancel = false;
        (async () => {
            try {
                await loadWithBootstrap(GOOGLE_KEY);
                await window.google.maps.importLibrary("maps");
                await window.google.maps.importLibrary("places");
                await window.google.maps.importLibrary("routes");
                if (!cancel) setG(window.google);
            } catch (e: any) {
                if (!cancel) setErrorMsg(e?.message || "Failed to load Google Maps");
            }
        })();
        return () => {
            cancel = true;
        };
    }, []);

    /** Load itinerary items & name */
    useEffect(() => {
        let cancel = false;
        (async () => {
            if (!itineraryId) return;
            try {
                const its = await api<ItineraryItem[]>(`/itinerary/${encodeURIComponent(itineraryId)}`);
                const list = await api<{ itineraryId: string; name: string }[]>(`/itinerary`);
                const found = list.find((x) => x.itineraryId === itineraryId);
                if (!cancel) {
                    setItems(its || []);
                    setTripName(found?.name || itineraryId);
                    if (its?.length && startIndex >= its.length) setStartIndex(0);
                }
            } catch (e: any) {
                if (!cancel) setErrorMsg(e?.message || "Failed to load itinerary");
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => {
            cancel = true;
        };
    }, [itineraryId]);

    /** Resolve coords ONCE per items change → write into resolvedItems (not items) */
    useEffect(() => {
        let canceled = false;
        (async () => {
            if (!g) return;

            // If everything already has coords, just mirror
            const needResolve = items.some((it) => !it.location || it.location.lat == null || it.location.lng == null);
            if (!needResolve) {
                if (!canceled) setResolvedItems(items);
                return;
            }

            const resolved = await Promise.all(
                items.map(async (it) => {
                    if (it.location?.lat != null && it.location?.lng != null) return it;
                    const loc = await resolveLatLng(g, it.placeId);
                    return { ...it, location: loc || it.location };
                })
            );
            if (canceled) return;
            setResolvedItems(resolved);
        })();
        return () => { canceled = true; };
    }, [g, items]);

    /** Init map once; draw markers whenever resolvedItems change */
    useEffect(() => {
        let canceled = false;
        (async () => {
            if (!g || resolvedItems.length === 0) return;

            const first = resolvedItems.find((x) => x.location);
            if (!mapCreatedRef.current && first?.location) {
                const { Map } = await g.maps.importLibrary("maps");
                const m = new Map(mapRef.current!, {
                    center: first.location,
                    zoom: 12,
                    mapTypeControl: false,
                });
                if (canceled) return;
                setMap(m);
                mapCreatedRef.current = true;
                if (!directionsRendererRef.current) {
                    directionsRendererRef.current = new g.maps.DirectionsRenderer({
                        map: m,
                        suppressMarkers: true,   // we use our own markers
                        preserveViewport: true,  // don't recenter too aggressively
                    });
                }
            }

            if (!map) return;

            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(map);
            }

            // Clear and redraw pins
            markersRef.current.forEach((mk) => mk.setMap(null));
            markersRef.current = [];

            const bounds = new g.maps.LatLngBounds();
            resolvedItems.forEach((it, idx) => {
                if (it.location) {
                    const mk = new g.maps.Marker({
                        map,
                        position: it.location,
                        label: String(idx + 1),
                        title: it.name || it.address || it.placeId,
                    });
                    markersRef.current.push(mk);
                    bounds.extend(it.location);
                }
            });
            if (!bounds.isEmpty()) map.fitBounds(bounds);
        })();
        return () => { canceled = true; };
    }, [g, map, resolvedItems]);

    /** Recompute route when mode/start/resolvedItems ready */
    /** Recompute route when mode/start/resolvedItems ready */
    useEffect(() => {
        if (!g || !map) return;
        const itemsWithLoc = resolvedItems.filter(
            (i) => i.location?.lat != null && i.location?.lng != null
        );

        if (itemsWithLoc.length < 2) {
            setOrder(resolvedItems.map((_, i) => i));
            setLegDurations([]);
            // 🔹 Clear blue route if not enough points
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(null);
            }
            return;
        }

        const token = ++computeTokenRef.current;
        setIsComputing(true);

        const boundedStart = Math.min(startIndex, itemsWithLoc.length - 1);

        computeAIRoute(g, itemsWithLoc, mode, boundedStart)
            .then((res) => {
                if (!res || computeTokenRef.current !== token) return; // stale

                // Map order back to resolvedItems indices (already aligned by itemsWithLoc)
                setOrder(res.order);
                setLegDurations(res.legDurations);

                // 🔥 Update marker labels to match visiting order (indices are for itemsWithLoc)
                if (markersRef.current?.length) {
                    markersRef.current.forEach((mk) => {
                        if (mk?.setLabel) mk.setLabel("");
                    });

                    res.order.forEach((idx, pos) => {
                        const mk = markersRef.current[idx];
                        if (mk?.setLabel) mk.setLabel(String(pos + 1));
                    });
                }

                // 🔵 Draw blue route line using DirectionsService
                if (!directionsRendererRef.current) return;

                const ordered = res.order
                    .map((i) => itemsWithLoc[i])
                    .filter((it) => it.location);
                if (ordered.length < 2) {
                    directionsRendererRef.current.setDirections(null);
                    return;
                }

                const directionsService = new g.maps.DirectionsService();
                const origin = ordered[0].location!;
                const destination = ordered[ordered.length - 1].location!;
                const waypoints =
                    ordered.length > 2
                        ? ordered.slice(1, -1).map((it) => ({
                            location: it.location!,
                            stopover: true,
                        }))
                        : [];

                const dmMode =
                    mode === "DRIVING"
                        ? g.maps.TravelMode.DRIVING
                        : mode === "WALKING"
                            ? g.maps.TravelMode.WALKING
                            : g.maps.TravelMode.BICYCLING;

                directionsService.route(
                    {
                        origin,
                        destination,
                        waypoints,
                        travelMode: dmMode,
                        optimizeWaypoints: false, // AI already chose order
                    },
                    (dirRes: any, status: string) => {
                        if (status === "OK" && dirRes) {
                            directionsRendererRef.current!.setDirections(dirRes);
                        } else {
                            console.warn("[AI-Route] Directions failed:", status);
                            directionsRendererRef.current!.setDirections(null);
                        }
                    }
                );
            })
            .finally(() => {
                if (computeTokenRef.current === token) setIsComputing(false);
            });
    }, [g, map, resolvedItems, mode, startIndex]);


    if (loading) return <div style={styles.page}><div style={styles.center}>Loading…</div></div>;
    if (errorMsg) return <div style={styles.page}><div style={styles.center}>Error: {errorMsg}</div></div>;
    if (!resolvedItems.length) return <div style={styles.page}><div style={styles.center}>No places in this trip.</div></div>;

    const orderedItems = order.length ? order.map((i) => resolvedItems[i]) : resolvedItems;
    // const totalDuration = useMemo(() => legDurations.reduce((a, b) => a + b, 0), [legDurations]);
    const sumMins = Math.round(totalDuration / 60000);

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <h1 style={styles.title}>AI Route Planning</h1>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {isComputing && <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Recomputing…</span>}
                    <button onClick={() => router.replace("/view-trips")} style={styles.secondaryBtn}>Back to Trips</button>
                    <button onClick={() => router.replace("/maps")} style={styles.primaryBtn}>Open Map Builder</button>
                </div>
            </div>

            {/* Controls */}
            <div style={styles.controls}>
                <div><strong>Trip:</strong> {tripName} <span style={{ color: "#6b7280" }}>({resolvedItems.length} stops)</span></div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <label>Mode</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as any)}
                        style={styles.select}
                        disabled={isComputing}
                    >
                        <option value="DRIVING">Driving (traffic-aware)</option>
                        <option value="WALKING">Walking</option>
                        <option value="BICYCLING">Bicycling</option>
                    </select>

                    <label>Start at</label>
                    <select
                        value={startIndex}
                        onChange={(e) => setStartIndex(Number(e.target.value))}
                        style={styles.select}
                        disabled={isComputing}
                    >
                        {resolvedItems.map((it, idx) => (
                            <option key={idx} value={idx}>{it.name || it.address || `Stop ${idx + 1}`}</option>
                        ))}
                    </select>

                    <div><strong>Total (est.):</strong> {isFinite(sumMins) ? `${sumMins} min` : "—"}</div>
                </div>
            </div>

            {/* Main: Map + Ordered list */}
            <div style={styles.main}>
                <div style={styles.map} ref={mapRef} />
                <div style={styles.panel}>
                    <div style={styles.panelTitle}>Suggested Order</div>
                    <ol style={{ paddingLeft: 18, margin: 0 }}>
                        {orderedItems.map((it, idx) => (
                            <li key={idx} style={{ marginBottom: 8 }}>
                                <div style={{ fontWeight: 600 }}>{it.name || "(Unnamed place)"}</div>
                                {it.address && <div style={{ fontSize: 12, color: "#6b7280" }}>{it.address}</div>}
                                {idx < legDurations.length && (
                                    <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
                                        → next leg: ~{Math.round(legDurations[idx] / 60000)} min
                                    </div>
                                )}
                            </li>
                        ))}
                    </ol>
                    <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                        Traffic-aware estimates where available. Actual times may vary.
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --------- AI Route core: Distance Matrix + nearest neighbor heuristic --------- */
async function computeAIRoute(
    g: G,
    items: ItineraryItem[],
    mode: "DRIVING" | "WALKING" | "BICYCLING",
    startIndex: number
): Promise<{ order: number[]; legDurations: number[] } | null> {
    await g.maps.importLibrary("routes"); // ensures DistanceMatrixService is available

    const coords = items.map((it) => it.location).filter(Boolean) as { lat: number; lng: number }[];
    if (coords.length < 2) return { order: items.map((_, i) => i), legDurations: [] };

    const service = new g.maps.DistanceMatrixService();
    const origins = items.map((it) => it.location!) as any[];
    const destinations = origins;

    const dmMode =
        mode === "DRIVING" ? g.maps.TravelMode.DRIVING :
            mode === "WALKING" ? g.maps.TravelMode.WALKING :
                g.maps.TravelMode.BICYCLING;

    const req: any = {
        origins,
        destinations,
        travelMode: dmMode,
        unitSystem: g.maps.UnitSystem.IMPERIAL, // or METRIC
    };

    if (dmMode === g.maps.TravelMode.DRIVING) {
        req.drivingOptions = { departureTime: new Date(), trafficModel: g.maps.TrafficModel.BEST_GUESS };
    }

    const matrix = await getDistanceMatrix(service, req);
    if (!matrix) return null;

    // Build cost table (ms)
    const N = items.length;
    const cost: number[][] = Array.from({ length: N }, () => Array(N).fill(Infinity));

    matrix.rows.forEach((row: any, i: number) => {
        row.elements.forEach((el: any, j: number) => {
            if (el.status === "OK") {
                const dur = el.duration_in_traffic?.value || el.duration?.value; // seconds
                if (typeof dur === "number") cost[i][j] = dur * 1000;
            }
        });
    });

    // Nearest-neighbor from chosen start
    const order: number[] = [];
    const used = new Array(N).fill(false);
    let curr = startIndex;
    order.push(curr);
    used[curr] = true;

    for (let step = 1; step < N; step++) {
        let best = -1;
        let bestCost = Infinity;
        for (let j = 0; j < N; j++) {
            if (!used[j] && cost[curr][j] < bestCost) {
                best = j;
                bestCost = cost[curr][j];
            }
        }
        if (best === -1) break;
        order.push(best);
        used[best] = true;
        curr = best;
    }

    // Leg durations along the path
    const legDurations = order.slice(0, -1).map((fromIdx, k) => {
        const toIdx = order[k + 1];
        return cost[fromIdx][toIdx];
    });

    return { order, legDurations };
}

/** Wrap DistanceMatrixService in a promise */
function getDistanceMatrix(service: any, req: any): Promise<any | null> {
    return new Promise((resolve) => {
        service.getDistanceMatrix(req, (res: any, status: string) => {
            if (status === "OK" && res) resolve(res);
            else resolve(null);
        });
    });
}

/** Resolve lat/lng via Places (New) then legacy fallback */
async function resolveLatLng(g: G, placeId: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const { Place } = await g.maps.importLibrary("places");
        const p = new (Place as any)({ id: placeId });
        await p.fetchFields({ fields: ["location"] });
        const loc = p.location;
        if (loc) return { lat: loc.lat(), lng: loc.lng() };
    } catch { }
    // Legacy fallback
    return new Promise((resolve) => {
        const svc = new g.maps.places.PlacesService(document.createElement("div"));
        svc.getDetails({ placeId, fields: ["geometry"] }, (out: any, status: any) => {
            if (status === g.maps.places.PlacesServiceStatus.OK && out?.geometry?.location) {
                return resolve({ lat: out.geometry.location.lat(), lng: out.geometry.location.lng() });
            }
            resolve(null);
        });
    });
}

/** Google bootstrap */
function loadWithBootstrap(key: string): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.innerHTML = `
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",
      q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),
      r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await
      (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)
      e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
      e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;
      d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=
      m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));
      d[l]?console.warn(p+" only loads once."):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
      ({ key: "${key}", v: "weekly" });
    `;
        s.onerror = () => reject(new Error("Failed to bootstrap Google Maps"));
        document.head.appendChild(s);
        const tick = () => (window.google?.maps?.importLibrary ? resolve() : setTimeout(tick, 50));
        tick();
    });
}

/** Styles */
const styles: Record<string, React.CSSProperties> = {
    page: { height: "100vh", display: "grid", gridTemplateRows: "auto auto 1fr", background: "#f7f7f8" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#111827", color: "white" },
    title: { margin: 0, fontSize: 18, fontWeight: 700 },
    primaryBtn: { background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
    secondaryBtn: { background: "#374151", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
    controls: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", gap: 12, flexWrap: "wrap", background: "white", borderBottom: "1px solid #e5e7eb" },
    select: { height: 36, borderRadius: 8, border: "1px solid #d1d5db", padding: "0 8px", background: "white" },
    main: { display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, padding: 16 },
    map: { width: "100%", height: "100%", minHeight: 420, background: "white", borderRadius: 12, border: "1px solid #e5e7eb" },
    panel: { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 },
    panelTitle: { fontWeight: 700, marginBottom: 8 },
    center: { display: "grid", placeItems: "center", height: "100vh", color: "#374151" },
};
