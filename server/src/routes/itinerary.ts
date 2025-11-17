// server/src/routes/itinerary.ts
import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { UserItineraries } from '../models/Itinerary';

const router = express.Router();

// Item shape expected from the client
type Item = {
    placeId: string;
    name?: string;
    address?: string;
    location?: { lat?: number; lng?: number };
};

// GET /itinerary -> list summaries for the logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.userId!;
        const doc = await UserItineraries.findById(userId);

        const summaries =
            doc?.itineraries?.map((it: any) => ({
                itineraryId: it.itineraryId,
                name: it.name || it.itineraryId,
                count: Array.isArray(it.items) ? it.items.length : 0,
                updatedAt: it.updatedAt,
            })) ?? [];

        // Sort by updatedAt desc if present
        summaries.sort((a: any, b: any) => {
            const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return tb - ta;
        });

        return res.json(summaries);
    } catch (e: any) {
        console.error('GET /itinerary error', e);
        return res.status(500).json({ error: e?.message || 'Server error' });
    }
});

// GET /itinerary/:itineraryId -> items for a specific itinerary
router.get('/:itineraryId', requireAuth, async (req, res) => {
    try {
        const userId = req.userId!;
        const { itineraryId } = req.params;

        const doc = await UserItineraries.findById(userId);
        if (!doc) return res.json([]);

        const target = (doc.itineraries as any[] | undefined)?.find(
            (it: any) => it.itineraryId === itineraryId
        );
        return res.json(target?.items ?? []);
    } catch (e: any) {
        console.error('GET /itinerary/:itineraryId error', e);
        return res.status(500).json({ error: e?.message || 'Server error' });
    }
});

// PUT /itinerary/:itineraryId -> upsert items & name, enforce unique name per user
router.put('/:itineraryId', requireAuth, async (req, res) => {
    try {
        const userId = req.userId!;
        const { itineraryId } = req.params;
        const { name, items = [] } = req.body as { name?: string; items: Item[] };

        const doc = await UserItineraries.findById(userId);
        if (!doc) {
            return res.status(404).json({ error: 'No itinerary document for user' });
        }

        // UNIQUE name (case-insensitive) across other itineraries for this user
        const newName = (name ?? '').trim();
        if (newName) {
            const clash = (doc.itineraries || []).some(
                (it: any) =>
                    (it.name || '').trim().toLowerCase() === newName.toLowerCase() &&
                    it.itineraryId !== itineraryId
            );
            if (clash) {
                return res
                    .status(409)
                    .json({ error: 'An itinerary with this name already exists.' });
            }
        }

        // Upsert itinerary by id
        let target = (doc.itineraries as any[] | undefined)?.find(
            (it: any) => it.itineraryId === itineraryId
        );
        if (!target) {
            target = {
                itineraryId,
                name: newName || itineraryId,
                items: [],
                updatedAt: new Date(),
            };
            (doc.itineraries as any[]).push(target);
        }

        if (newName) target.name = newName;
        target.items = Array.isArray(items) ? items : [];
        target.updatedAt = new Date();

        await doc.save();
        return res.json({ ok: true });
    } catch (e: any) {
        console.error('PUT /itinerary/:itineraryId error', e);
        return res.status(500).json({ error: e?.message || 'Server error' });
    }
});

export default router;
