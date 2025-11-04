import mongoose, { Schema } from "mongoose";

/* ---------- Chat Message schema ---------- */
const ChatMessageSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        type: { 
            type: String, 
            enum: ['text', 'itinerary_update', 'system'], 
            default: 'text' 
        },
    },
    { _id: true } // Allow MongoDB to generate _id for each message
);

/* ---------- Group Member schema ---------- */
const GroupMemberSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { 
            type: String, 
            enum: ['admin', 'member'], 
            default: 'member' 
        },
        joinedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

/* ---------- Shared Itinerary Group schema ---------- */
const ShareItinerarySchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        members: { type: [GroupMemberSchema], default: [] },
        itineraryId: { type: String, required: true }, // Links to existing itinerary
        messages: { type: [ChatMessageSchema], default: [] },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // userId of creator
    },
    { 
        timestamps: true, 
        collection: "share_iti" // This creates the share_iti collection
    }
);

/* ---------- Indexes for better performance ---------- */
ShareItinerarySchema.index({ itineraryId: 1 });
ShareItinerarySchema.index({ "members.userId": 1 });
ShareItinerarySchema.index({ createdBy: 1 });
ShareItinerarySchema.index({ createdAt: -1 });

/* ---------- Debug hooks ---------- */
ShareItinerarySchema.pre("save", function (next) {
    console.log(
        `[DEBUG] Saving shared itinerary group: ${this.name} with ${this.members?.length || 0} members`
    );
    next();
});

ShareItinerarySchema.post("save", function (doc) {
    console.log(
        `[DEBUG] Successfully saved shared itinerary group: ${doc.name} (ID: ${doc._id})`
    );
});

/* ---------- Instance methods ---------- */
ShareItinerarySchema.methods.addMember = function(userId: string, role: string = 'member') {
    // Check if user is already a member
    const existingMember = this.members.find((member: any) => member.userId.toString() === userId);
    if (existingMember) {
        throw new Error('User is already a member of this group');
    }
    
    this.members.push({ userId, role });
    return this.save();
};

ShareItinerarySchema.methods.removeMember = function(userId: string) {
    this.members = this.members.filter((member: any) => member.userId.toString() !== userId);
    return this.save();
};

ShareItinerarySchema.methods.addMessage = function(userId: string, message: string, type: string = 'text') {
    // For system messages, we'll use a special system user ID (null) or the first admin's ID
    let actualUserId = userId;
    
    if (userId === 'system') {
        // For system messages, use the group creator's ID
        actualUserId = this.createdBy;
    }
    
    this.messages.push({ userId: actualUserId, message, type });
    return this.save();
};

/* ---------- Static methods ---------- */
ShareItinerarySchema.statics.findByMember = function(userId: string) {
    return this.find({ "members.userId": userId, isActive: true });
};

ShareItinerarySchema.statics.findByItinerary = function(itineraryId: string) {
    return this.find({ itineraryId, isActive: true });
};

/* ---------- Model export ---------- */
export type ShareItineraryDoc = mongoose.InferSchemaType<typeof ShareItinerarySchema>;
export const ShareItinerary = 
    mongoose.models.ShareItinerary || 
    mongoose.model("ShareItinerary", ShareItinerarySchema);