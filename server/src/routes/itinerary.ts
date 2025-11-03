// server/src/routes/itinerary.ts
import express from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/requireAuth';
import { UserItineraries } from '../models/Itinerary';

const router = express.Router();

/** A minimal lean type for our UserItineraries doc */
type LeanItem = {
    placeId: string;
    name?: string;
    address?: string;
    location?: { lat?: number; lng?: number };
};

type LeanSubItinerary = {
    itineraryId: string;
    name?: string;
    items?: LeanItem[];
    updatedAt?: Date;
};

type LeanUserItineraries = {
    _id: Types.ObjectId;
    itineraries: LeanSubItinerary[];
    updatedAt?: Date;
};

// GET /itinerary → list all itineraries (lightweight)
router.get('/', requireAuth, async (req: any, res) => {
    // Explicitly tell TS the shape we expect from .lean()
    const doc = await UserItineraries.findById(req.userId).lean<LeanUserItineraries | null>();

    const safeDoc: LeanUserItineraries = doc ?? {
        _id: new Types.ObjectId(req.userId),
        itineraries: [],
    };

    const list = (safeDoc.itineraries || []).map((it) => ({
        itineraryId: it.itineraryId,
        name: it.name || '',
        count: it.items?.length || 0,
        updatedAt: it.updatedAt || safeDoc.updatedAt,
    }));

    res.json(list);
});

// GET /itinerary/:itineraryId → items for that itinerary
router.get('/:itineraryId', requireAuth, async (req: any, res) => {
    const { itineraryId } = req.params;

    const doc = await UserItineraries.findById(req.userId).lean<LeanUserItineraries | null>();
    const safeDoc: LeanUserItineraries = doc ?? {
        _id: new Types.ObjectId(req.userId),
        itineraries: [],
    };

    const hit = (safeDoc.itineraries || []).find((i) => i.itineraryId === itineraryId);
    res.json(hit?.items || []);
});

// PUT /itinerary/:itineraryId → replace items (Save button)
router.put('/:itineraryId', requireAuth, async (req: any, res) => {
    const { itineraryId } = req.params;
    const { name, items } = (req.body ?? {}) as { name?: string; items?: LeanItem[] };

    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items must be an array' });
    }

    // Get doc as a real Mongoose document (not lean) so we can mutate & save.
    const doc =
        (await UserItineraries.findById(req.userId)) ||
        (await UserItineraries.create({ _id: req.userId, itineraries: [] }));

    const idx = doc.itineraries.findIndex((i: any) => i.itineraryId === itineraryId);
    if (idx === -1) {
        doc.itineraries.push({
            itineraryId,
            name: name || '',
            items,
            updatedAt: new Date(),
        } as any);
    } else {
        (doc.itineraries[idx] as any).items = items;
        if (typeof name === 'string') (doc.itineraries[idx] as any).name = name;
        (doc.itineraries[idx] as any).updatedAt = new Date();
    }

    await doc.save();
    res.json({ ok: true });
});

router.post('/', requireAuth, async (req, res) => {
    const userId = req.userId;
    const { items } = req.body;
    console.log('[DEBUG] /itinerary POST — userId:', userId, 'items:', items);

    try {
        let doc = await UserItineraries.findOne({ userId });
        if (!doc) {
            doc = new UserItineraries({ userId, itineraries: [] });
        }
        const newItinerary = { itineraryId: new Types.ObjectId(), items };
        doc.itineraries.push(newItinerary);
        await doc.save();

        console.log('[DEBUG] Itinerary saved successfully for user:', userId);
        res.json({ success: true, itineraryId: newItinerary.itineraryId });
    } catch (err) {
        console.error('[DEBUG] Error saving itinerary for user:', userId, err);
        res.status(500).json({ error: 'Server error' });
    }
});


export default router;
