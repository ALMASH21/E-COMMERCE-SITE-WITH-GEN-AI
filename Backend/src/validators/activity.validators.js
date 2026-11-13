const { body } = require("express-validator");

const activityValidators = [
    body("eventId")
        .isString().withMessage("eventId must be text.")
        .bail()
        .isLength({ min: 8, max: 128 }).withMessage("eventId must be between 8 and 128 characters.")
        .matches(/^[A-Za-z0-9_-]+$/).withMessage("eventId contains unsupported characters.")
        .bail()
        .custom((_, { req }) => {
            const allowedFields = ["eventId", "type", "productId", "query"];
            const unexpectedFields = Object.keys(req.body).filter((key) => !allowedFields.includes(key));
            if (unexpectedFields.length) {
                throw new Error("Activity contains unsupported fields.");
            }

            if (req.body.type === "search") {
                if (typeof req.body.query !== "string" || !req.body.query.trim()) {
                    throw new Error("A search query is required for search activity.");
                }
                if (req.body.productId !== undefined) {
                    throw new Error("Search activity cannot include a product id.");
                }
            } else {
                if (!req.body.productId) {
                    throw new Error("A product id is required for this activity type.");
                }
                if (req.body.query !== undefined) {
                    throw new Error("Product activity cannot include a search query.");
                }
            }

            return true;
        }),
    body("type")
        .isIn(["product_view", "search", "add_to_cart", "wishlist_add", "wishlist_remove"])
        .withMessage("Activity type is invalid."),
    body("productId").optional().isMongoId().withMessage("productId must be a valid product id."),
    body("query")
        .optional()
        .isString().withMessage("query must be text.")
        .bail()
        .trim()
        .isLength({ min: 1, max: 200 }).withMessage("query must be between 1 and 200 characters."),
];

module.exports = activityValidators;
