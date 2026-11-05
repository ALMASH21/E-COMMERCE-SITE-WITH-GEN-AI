const mongoose = require("mongoose");

// Stock is an integer quantity and is stored alongside each product for inventory visibility.
const productSchema = new mongoose.Schema({
    image: String,
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        default: "Accessories",
        trim: true,
    },
    status: {
        type: String,
        enum: ["Active", "Draft", "Archived"],
        default: "Active",
    },
    sku: { type: String, trim: true, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 4.8 },
    badge: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    handFinished: { type: Boolean, default: true },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "Stock must be a whole number.",
        },
    },
    reorderPoint: { type: Number, default: 10, min: 0 },
    bgcolor: String,
    panelcolor: String,
    textcolor: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "owner",
    },
}, { timestamps: true });

module.exports = mongoose.model("product", productSchema);