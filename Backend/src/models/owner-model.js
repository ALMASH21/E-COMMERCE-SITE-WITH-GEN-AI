const mongoose = require("mongoose");

// Staff accounts are stored separately from customers so their roles cannot be self-assigned.
const ownerSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
    },
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
        enum: ["owner", "admin"],
        default: "owner",
        required: true,
    },
    products: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "product",
        default: [],
    },
    picture: String,
    gstin: String,
});

module.exports = mongoose.model("owner", ownerSchema);