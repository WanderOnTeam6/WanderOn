import mongoose, { Schema } from 'mongoose';

const ItemSchema = new Schema(
    {
        placeId: { type: String, required: true },
        name: String,
        address: String,
        location: { lat: Number, lng: Number },
    },
    { _id: false }
);

const SubItinerarySchema = new Schema(
    {
        itineraryId: { type: String, required: true },
        name: { type: String, default: "" },
        items: { type: [ItemSchema], default: [] },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const UserItinerariesSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, ref: 'User' }, // <-- user's _id
        itineraries: { type: [SubItinerarySchema], default: [] },
    },
    { timestamps: true, collection: 'itinerary' }
);

export type ItineraryDoc = mongoose.InferSchemaType<typeof UserItinerariesSchema>;
export const UserItineraries =
    mongoose.models.UserItineraries || mongoose.model('UserItineraries', UserItinerariesSchema);
