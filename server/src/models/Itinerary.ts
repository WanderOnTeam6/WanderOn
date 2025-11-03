import mongoose, { Schema } from "mongoose";

/* ---------- Item schema: each saved place ---------- */
const ItemSchema = new Schema(
    {
        placeId: { type: String, required: true },
        name: { type: String, default: "" },
        address: { type: String, default: "" },
        location: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
        },
    },
    { _id: false }
);

/* ---------- Sub-itinerary schema (one itinerary per user) ---------- */
const SubItinerarySchema = new Schema(
    {
        itineraryId: { type: String, required: true },
        name: { type: String, default: "" },
        items: { type: [ItemSchema], default: [] },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

/* ---------- Main user-itineraries schema ---------- */
const UserItinerariesSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, ref: "User" }, // user’s Mongo _id
        itineraries: { type: [SubItinerarySchema], default: [] },
    },
    { timestamps: true, collection: "itinerary" }
);

/* ---------- Debug hooks ---------- */
UserItinerariesSchema.pre("save", function (next) {
    console.log(
        `[DEBUG] Saving itineraries for user ${this._id}:`,
        JSON.stringify(this.itineraries, null, 2)
    );
    next();
});

UserItinerariesSchema.post("save", function (doc) {
    console.log(
        `[DEBUG] Successfully saved itineraries for user ${doc._id}. Total itineraries:`,
        doc.itineraries?.length || 0
    );
});

/* ---------- Model export ---------- */
export type ItineraryDoc = mongoose.InferSchemaType<typeof UserItinerariesSchema>;
export const UserItineraries =
    mongoose.models.UserItineraries ||
    mongoose.model("UserItineraries", UserItinerariesSchema);
