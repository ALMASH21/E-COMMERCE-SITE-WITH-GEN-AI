const mongoose = require("mongoose");

// Customer accounts default to the least-privileged role; signup cannot grant staff access.
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
    },
    phoneNo: {
        type: String,
        minlength: 10,
        trim: true,
    },
    dob: Date,
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ["customer"],
        default: "customer",
        immutable: true,
    },
    cart: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
    preferences: {
        earlyAccess: { type: Boolean, default: true },
        journalNotes: { type: Boolean, default: false },
    },
    addresses: [{
        recipient: { type: String, trim: true },
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        country: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        isDefault: { type: Boolean, default: true },
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
    }],
    orders: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
    },
    contact: Number,
    picture: String,
}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);