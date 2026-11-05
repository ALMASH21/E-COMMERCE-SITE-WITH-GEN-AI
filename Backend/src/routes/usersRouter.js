const express = require("express");
const { body, param } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { authUser } = require("../middlewares/isLoggedIn");
const validateRequest = require("../middlewares/validateRequest");
const authValidators = require("../validators/auth.validators");
const productModel = require("../models/product-model");

const router = express.Router();

// Customer authentication endpoints; role assignment is intentionally not accepted here.
router.post("/register", authValidators.register, validateRequest, authController.register);
router.post("/login", authValidators.login, validateRequest, authController.loginCustomer);
router.post("/logout", authController.logout);
router.get("/profile", authUser, authController.getProfile);
router.patch(
    "/profile",
    authUser,
    body("fullname").optional().isString().trim().isLength({ min: 3, max: 80 }),
    body("phoneNo").optional({ nullable: true }).isString().trim().isLength({ min: 10, max: 20 }),
    body("preferences").optional().isObject(),
    body("preferences.earlyAccess").optional().isBoolean().toBoolean(),
    body("preferences.journalNotes").optional().isBoolean().toBoolean(),
    body("addresses").optional().isArray({ max: 10 }),
    body("addresses.*.recipient").optional().isString().trim().notEmpty(),
    body("addresses.*.street").optional().isString().trim().notEmpty(),
    body("addresses.*.city").optional().isString().trim().notEmpty(),
    body("addresses.*.country").optional().isString().trim().notEmpty(),
    body("addresses.*.postalCode").optional().isString().trim().notEmpty(),
    body("addresses.*.isDefault").optional().isBoolean().toBoolean(),
    validateRequest,
    authController.updateProfile
);
router.put(
    "/wishlist/:productId",
    authUser,
    param("productId").isMongoId().withMessage("Invalid product id."),
    validateRequest,
    async (req, res, next) => {
        try {
            const product = await productModel.findOne({ _id: req.params.productId, status: "Active" });
            if (!product) return res.status(404).json({ message: "Product not found." });
            if (!req.user.wishlist.some((id) => id.toString() === product._id.toString())) {
                req.user.wishlist.push(product._id);
                await req.user.save();
            }
            return res.status(200).json({ wishlist: req.user.wishlist });
        } catch (error) {
            return next(error);
        }
    }
);
router.delete(
    "/wishlist/:productId",
    authUser,
    param("productId").isMongoId().withMessage("Invalid product id."),
    validateRequest,
    async (req, res, next) => {
        try {
            req.user.wishlist = req.user.wishlist.filter((id) => id.toString() !== req.params.productId);
            await req.user.save();
            return res.status(200).json({ wishlist: req.user.wishlist });
        } catch (error) {
            return next(error);
        }
    }
);

module.exports = router;
