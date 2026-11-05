const express = require("express");
const { body } = require("express-validator");
const orderModel = require("../models/order-model");
const productModel = require("../models/product-model");
const { authUser, authorizeRoles } = require("../middlewares/isLoggedIn");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

router.post(
    "/",
    authUser,
    body("items").isArray({ min: 1 }).withMessage("At least one item is required."),
    body("items.*.productId").isMongoId().withMessage("Each item must have a valid product id."),
    body("items.*.quantity").isInt({ min: 1, max: 50 }).withMessage("Item quantity must be between 1 and 50.").toInt(),
    body("shippingAddress.fullname").isString().trim().notEmpty(),
    body("shippingAddress.email").isEmail().normalizeEmail(),
    body("shippingAddress.street").isString().trim().notEmpty(),
    body("shippingAddress.city").isString().trim().notEmpty(),
    body("shippingAddress.country").isString().trim().notEmpty(),
    body("shippingAddress.postalCode").isString().trim().notEmpty(),
    body("shippingMethod").optional().isIn(["standard", "express"]),
    body("promotionCode").optional().isString().trim().isLength({ max: 40 }),
    validateRequest,
    async (req, res, next) => {
        const heldStock = [];
        try {
            if (req.user.role !== "customer") {
                return res.status(403).json({ message: "Only customer accounts can place orders." });
            }

            const quantities = new Map();
            for (const item of req.body.items) {
                quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
            }
            const products = await productModel.find({
                _id: { $in: [...quantities.keys()] },
                status: "Active",
            });
            if (products.length !== quantities.size) {
                return res.status(400).json({ message: "One or more products are unavailable." });
            }

            const items = products.map((product) => {
                const quantity = quantities.get(product._id.toString());
                return {
                    product: product._id,
                    name: product.name,
                    category: product.category,
                    image: product.image,
                    quantity,
                    unitPrice: product.price * (1 - (product.discount || 0) / 100),
                    lineTotal: product.price * (1 - (product.discount || 0) / 100) * quantity,
                };
            });
            const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
            const discount = req.body.promotionCode?.toUpperCase() === "AUREL10" ? subtotal * 0.1 : 0;
            const shippingMethod = req.body.shippingMethod || "standard";
            const shipping = shippingMethod === "express" ? 18 : 0;
            const tax = (subtotal - discount) * 0.08;

            for (const [productId, quantity] of quantities) {
                const updated = await productModel.findOneAndUpdate(
                    { _id: productId, status: "Active", stock: { $gte: quantity } },
                    { $inc: { stock: -quantity } },
                    { new: true }
                );
                if (!updated) {
                    for (const held of heldStock) {
                        await productModel.updateOne({ _id: held.productId }, { $inc: { stock: held.quantity } });
                    }
                    return res.status(409).json({ message: "Stock changed while placing your order. Please review your bag." });
                }
                heldStock.push({ productId, quantity });
            }

            try {
                const order = await orderModel.create({
                    customer: req.user._id,
                    items,
                    shippingAddress: req.body.shippingAddress,
                    shippingMethod,
                    subtotal,
                    discount,
                    shipping,
                    tax,
                    total: subtotal - discount + shipping + tax,
                });
                return res.status(201).json({ order });
            } catch (error) {
                for (const held of heldStock) {
                    await productModel.updateOne({ _id: held.productId }, { $inc: { stock: held.quantity } });
                }
                throw error;
            }
        } catch (error) {
            return next(error);
        }
    }
);

router.get("/", authUser, async (req, res, next) => {
    try {
        const orders = await orderModel.find({ customer: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
