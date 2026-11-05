const express = require("express");
const bcrypt = require("bcrypt");
const authController = require("../controllers/auth.controller");
const ownerModel = require("../models/owner-model");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");
const { authUser, authorizeRoles } = require("../middlewares/isLoggedIn");
const { body, param } = require("express-validator");
const { publicAccount } = authController;
const validateRequest = require("../middlewares/validateRequest");
const authValidators = require("../validators/auth.validators");

const router = express.Router();

router.get("/", (req, res) => {
    return res.status(200).json({ message: "Owner routes are ready." });
});

// Staff sign in is separate from customer sign in.
router.post("/login", authValidators.login, validateRequest, authController.loginOwner);
router.get("/profile", authUser, authorizeRoles("owner", "admin"), (req, res) => {
    return res.status(200).json({ user: publicAccount(req.user) });
});
router.get("/products", authUser, authorizeRoles("owner", "admin"), async (req, res, next) => {
    try {
        const filter = {};
        if (typeof req.query.category === "string" && req.query.category !== "all") filter.category = req.query.category;
        if (typeof req.query.status === "string" && req.query.status !== "all") filter.status = req.query.status;
        if (typeof req.query.search === "string" && req.query.search.trim()) {
            const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.name = { $regex: search, $options: "i" };
        }
        const products = await productModel.find(filter).sort({ updatedAt: -1 });
        return res.status(200).json({ products });
    } catch (error) {
        return next(error);
    }
});
router.post(
    "/products",
    authUser,
    authorizeRoles("owner", "admin"),
    body("name").isString().trim().notEmpty().withMessage("Product name is required."),
    body("category").isString().trim().notEmpty().withMessage("Category is required."),
    body("price").isFloat({ min: 0 }).toFloat(),
    body("stock").optional().isInt({ min: 0 }).toInt(),
    body("reorderPoint").optional().isInt({ min: 0 }).toInt(),
    body("sku").optional().isString(),
    body("discount").optional().isFloat({ min: 0, max: 100 }).toFloat(),
    body("status").optional().isIn(["Active", "Draft", "Archived"]),
    body("image").optional().isString(),
    validateRequest,
    async (req, res, next) => {
        try {
            const product = await productModel.create({ ...req.body, createdBy: req.user._id });
            return res.status(201).json({ product });
        } catch (error) {
            if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
            return next(error);
        }
    }
);
router.patch(
    "/products/:productId",
    authUser,
    authorizeRoles("owner", "admin"),
    param("productId").isMongoId().withMessage("Invalid product id."),
    body("name").optional().isString().trim().notEmpty(),
    body("category").optional().isString().trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }).toFloat(),
    body("stock").optional().isInt({ min: 0 }).toInt(),
    body("reorderPoint").optional().isInt({ min: 0 }).toInt(),
    body("discount").optional().isFloat({ min: 0, max: 100 }).toFloat(),
    body("status").optional().isIn(["Active", "Draft", "Archived"]),
    body("image").optional().isString(),
    body("sku").optional().isString(),
    validateRequest,
    async (req, res, next) => {
        try {
            const allowedFields = ["name", "category", "price", "stock", "reorderPoint", "discount", "status", "image", "sku"];
            const updates = Object.fromEntries(
                Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
            );
            const product = await productModel.findByIdAndUpdate(
                req.params.productId,
                { $set: updates },
                { new: true, runValidators: true }
            );
            if (!product) return res.status(404).json({ message: "Product not found." });
            return res.status(200).json({ product });
        } catch (error) {
            if (error.name === "ValidationError" || error.name === "CastError") {
                return res.status(400).json({ message: error.message });
            }
            return next(error);
        }
    }
);
router.delete(
    "/products/:productId",
    authUser,
    authorizeRoles("owner", "admin"),
    param("productId").isMongoId().withMessage("Invalid product id."),
    validateRequest,
    async (req, res, next) => {
        try {
            const product = await productModel.findByIdAndDelete(req.params.productId);
            if (!product) return res.status(404).json({ message: "Product not found." });
            return res.status(200).json({ message: "Product deleted successfully." });
        } catch (error) {
            return next(error);
        }
    }
);
router.get("/orders", authUser, authorizeRoles("owner", "admin"), async (req, res, next) => {
    try {
        const orders = await orderModel.find()
            .populate("customer", "fullname email")
            .sort({ createdAt: -1 })
            .limit(100);
        return res.status(200).json({ orders });
    } catch (error) {
        return next(error);
    }
});
router.patch(
    "/orders/:orderId/status",
    authUser,
    authorizeRoles("owner", "admin"),
    param("orderId").isMongoId().withMessage("Invalid order id."),
    body("status").isIn(["Processing", "Shipped", "Delivered", "Cancelled"]),
    validateRequest,
    async (req, res, next) => {
        const order = await orderModel.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found." });
        const previousStatus = order.status;
        const nextStatus = req.body.status;
        const reserved = [];
        const restocked = [];
        try {
            await order.populate("customer", "fullname email");
            if (previousStatus === "Cancelled" && nextStatus !== "Cancelled") {
                for (const item of order.items) {
                    const product = await productModel.findOneAndUpdate(
                        { _id: item.product, status: "Active", stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } },
                        { new: true }
                    );
                    if (!product) {
                        for (const held of reserved) {
                        await productModel.updateOne({ _id: held.product }, { $inc: { stock: held.quantity } });
                        }
                        return res.status(409).json({ message: "There is not enough stock to reopen this order." });
                    }
                    reserved.push({ product: item.product, quantity: item.quantity });
                }
            }

            if (previousStatus !== "Cancelled" && nextStatus === "Cancelled") {
                for (const item of order.items) {
                    await productModel.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
                    restocked.push({ product: item.product, quantity: item.quantity });
                }
            }

            order.status = nextStatus;
            await order.save();
            return res.status(200).json({ order });
        } catch (error) {
            for (const held of reserved) {
                await productModel.updateOne({ _id: held.product, $inc: { stock: held.quantity } });
            }
            for (const held of restocked) {
                await productModel.updateOne({ _id: held.product }, { $inc: { stock: -held.quantity } });
            }
            return next(error);
        }
    }
);
router.get("/customers", authUser, authorizeRoles("owner", "admin"), async (req, res, next) => {
    try {
        const [customers, spending] = await Promise.all([
            userModel.find().select("fullname email createdAt").sort({ createdAt: -1 }).limit(200).lean(),
            orderModel.aggregate([
                { $match: { status: { $ne: "Cancelled" } } },
                { $group: { _id: "$customer", orders: { $sum: 1 }, spent: { $sum: "$total" } } },
            ]),
        ]);
        const totals = new Map(spending.map((item) => [item._id.toString(), item]));
        return res.status(200).json({
            customers: customers.map((customer) => ({
                ...customer,
                ...totals.get(customer._id.toString()),
                orders: totals.get(customer._id.toString())?.orders || 0,
                spent: totals.get(customer._id.toString())?.spent || 0,
            })),
        });
    } catch (error) {
        return next(error);
    }
});
router.get("/dashboard", authUser, authorizeRoles("owner", "admin"), async (req, res, next) => {
    try {
        const ranges = { "7 days": 7, "30 days": 30, "12 months": 365 };
        const days = ranges[req.query.range] || 30;
        const from = new Date();
        from.setDate(from.getDate() - days);

        const [orderStats] = await orderModel.aggregate([
            { $match: { createdAt: { $gte: from }, status: { $ne: "Cancelled" } } },
            { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: { $subtract: ["$subtotal", "$discount"] } } } },
        ]);
        const [customers, products, lowStock, recentOrders, categoryRevenue, chartOrders] = await Promise.all([
            userModel.countDocuments(),
            productModel.countDocuments({ status: { $ne: "Archived" } }),
            productModel.countDocuments({ status: "Active", $expr: { $lte: ["$stock", "$reorderPoint"] } }),
            orderModel.find().populate("customer", "fullname email").sort({ createdAt: -1 }).limit(5),
            orderModel.aggregate([
                { $match: { createdAt: { $gte: from }, status: { $ne: "Cancelled" } } },
                { $unwind: "$items" },
                { $group: { _id: "$items.category", revenue: { $sum: "$items.lineTotal" } } },
                { $sort: { revenue: -1 } },
            ]),
            orderModel.find({ createdAt: { $gte: from }, status: { $ne: "Cancelled" } }).select("createdAt total").sort({ createdAt: 1 }),
        ]);

        const categoryTotal = categoryRevenue.reduce((sum, item) => sum + item.revenue, 0);
        const categories = categoryRevenue.map((item) => ({
            name: item._id || "Other",
            revenue: item.revenue,
            share: categoryTotal ? Math.round((item.revenue / categoryTotal) * 100) : 0,
        }));
        const bucketCount = days === 7 ? 7 : days === 30 ? 6 : 12;
        const buckets = Array.from({ length: bucketCount }, (_, index) => {
            const date = new Date(from);
            if (days === 7) date.setDate(from.getDate() + index);
            else if (days === 30) date.setDate(from.getDate() + index * 5);
            else date.setMonth(from.getMonth() + index);
            return {
                label: days === 7 ? date.toLocaleDateString("en", { weekday: "short" })
                    : date.toLocaleDateString("en", { month: "short" }),
                revenue: 0,
            };
        });
        for (const order of chartOrders) {
            const position = Math.min(bucketCount - 1, Math.floor(
                ((order.createdAt - from) / (Date.now() - from.getTime())) * bucketCount
            ));
            buckets[Math.max(0, position)].revenue += order.total;
        }

        return res.status(200).json({
            metrics: {
                revenue: orderStats?.revenue || 0,
                orders: orderStats?.orders || 0,
                customers,
                products,
            },
            lowStock,
            recentOrders,
            categories,
            revenue: buckets,
        });
    } catch (error) {
        return next(error);
    }
});

// Development-only bootstrap creates the first admin; provision staff accounts securely in production.
if (process.env.NODE_ENV !== "production") {
    router.post(
        "/create",
        authValidators.createAdmin,
        validateRequest,
        async (req, res, next) => {
            try {
                const { fullname, email } = req.body;
                const password = req.body.password;
                if (await ownerModel.exists({})) {
                    return res.status(409).json({ message: "The development admin has already been created." });
                }
                if (await userModel.exists({ email })) {
                    return res.status(409).json({ message: "An account with this email already exists." });
                }

                const owner = await ownerModel.create({
                    fullname,
                    email,
                    password: await bcrypt.hash(password, 12),
                    role: "admin",
                });
                return res.status(201).json({ user: publicAccount(owner) });
            } catch (error) {
                if (error.code === 11000) {
                    return res.status(409).json({ message: "An account with this email already exists." });
                }
                if (error.name === "ValidationError") {
                    return res.status(400).json({ message: error.message });
                }
                return next(error);
            }
        }
    );
}

module.exports = router;
