const express = require("express");
const { body, param } = require("express-validator");
const productModel = require("../models/product-model");
const { authUser, authorizeRoles } = require("../middlewares/isLoggedIn");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();
const staffOnly = [authUser, authorizeRoles("owner", "admin")];

// Product reads are public; inventory changes are limited to authenticated staff.
router.get("/", async (req, res, next) => {
    try {
        const filter = { status: "Active" };
        if (typeof req.query.category === "string" && req.query.category.trim()) {
            filter.category = req.query.category.trim();
        }
        if (typeof req.query.search === "string" && req.query.search.trim()) {
            const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.name = { $regex: search, $options: "i" };
        }
        const products = await productModel.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ products });
    } catch (error) {
        return next(error);
    }
});

router.get("/:productId", param("productId").isMongoId().withMessage("Invalid product id."), validateRequest, async (req, res, next) => {
    try {
        const product = await productModel.findOne({ _id: req.params.productId, status: "Active" });
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        return res.status(200).json({ product });
    } catch (error) {
        return next(error);
    }
});

router.post(
    "/",
    ...staffOnly,
    body("name").isString().withMessage("name must be text.").bail().trim().notEmpty().withMessage("name is required."),
    body("category").optional().isString().trim().notEmpty().withMessage("category must be text."),
    body("price").isFloat({ min: 0 }).withMessage("price must be a non-negative number.").toFloat(),
    body("discount").optional().isFloat({ min: 0, max: 100 }).withMessage("discount must be between 0 and 100.").toFloat(),
    body("stock").optional().isInt({ min: 0 }).withMessage("stock must be a non-negative whole number.").toInt(),
    body("status").optional().isIn(["Active", "Draft", "Archived"]).withMessage("status is invalid."),
    body("image").optional().isString().withMessage("image must be text."),
    body("bgcolor").optional().isString().withMessage("bgcolor must be text."),
    body("panelcolor").optional().isString().withMessage("panelcolor must be text."),
    body("textcolor").optional().isString().withMessage("textcolor must be text."),
    validateRequest,
    async (req, res, next) => {
        try {
            const product = await productModel.create({
                image: req.body.image,
                name: req.body.name,
                category: req.body.category,
                price: req.body.price,
                discount: req.body.discount,
                stock: req.body.stock,
                status: req.body.status,
                bgcolor: req.body.bgcolor,
                panelcolor: req.body.panelcolor,
                textcolor: req.body.textcolor,
                createdBy: req.user._id,
            });
            return res.status(201).json({ product });
        } catch (error) {
            if (error.name === "ValidationError" || error.name === "CastError") {
                return res.status(400).json({ message: error.message });
            }
            return next(error);
        }
    }
);

router.patch(
    "/:productId/stock",
    ...staffOnly,
    param("productId").isMongoId().withMessage("Invalid product id."),
    body("stock").isInt({ min: 0 }).withMessage("stock must be a non-negative whole number.").toInt(),
    validateRequest,
    async (req, res, next) => {
        const stock = req.body.stock;

        try {
            const product = await productModel.findByIdAndUpdate(
                req.params.productId,
                { $set: { stock } },
                { new: true, runValidators: true }
            );
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }
            return res.status(200).json({ product });
        } catch (error) {
            if (error.name === "ValidationError" || error.name === "CastError") {
                return res.status(400).json({ message: error.message });
            }
            return next(error);
        }
    }
);

module.exports = router;
