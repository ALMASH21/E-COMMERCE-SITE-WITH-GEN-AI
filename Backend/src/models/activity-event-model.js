const mongoose = require("mongoose");

const activityEventSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    eventId: {
        type: String,
        required: true,
        maxlength: 128,
    },
    type: {
        type: String,
        required: true,
        enum: ["product_view", "search", "add_to_cart", "wishlist_add", "wishlist_remove"],
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    },
    query: {
        type: String,
        maxlength: 200,
    },
}, { timestamps: true });

activityEventSchema.index({ user: 1, eventId: 1 }, { unique: true, name: "user_event_id_unique" });
activityEventSchema.index({ user: 1, createdAt: -1 }, { name: "user_activity_recent" });
activityEventSchema.index({ user: 1, type: 1, createdAt: -1 }, { name: "user_activity_by_type" });

module.exports = mongoose.model("activityEvent", activityEventSchema);
