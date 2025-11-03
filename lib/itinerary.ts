import { api } from '@/lib/api';

export type ItineraryItem = {
    placeId: string;
    name?: string;
    address?: string;
    location?: { lat: number; lng: number };
};

export type ItinerarySummary = {
    itineraryId: string;
    name: string;
    count: number;
    updatedAt?: string;
};

export async function listItineraries(): Promise<ItinerarySummary[]> {
    return api('/itinerary'); // GET
}

export async function getItinerary(itineraryId: string): Promise<ItineraryItem[]> {
    return api(`/itinerary/${encodeURIComponent(itineraryId)}`); // GET
}

export async function saveItinerary(
    itineraryId: string,
    items: ItineraryItem[],
    name?: string
): Promise<void> {
    await api(`/itinerary/${encodeURIComponent(itineraryId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, items }),
    });
}

export async function createItinerary(itineraryId: string, name?: string): Promise<void> {
    await api(`/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itineraryId, name }),
    });
}
