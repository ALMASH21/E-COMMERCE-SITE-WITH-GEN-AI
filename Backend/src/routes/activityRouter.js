const express = require("express");
const { authUser, authorizeRoles } = require("../middlewares/isLoggedIn");
const validateRequest = require("../middlewares/validateRequest");
const activityValidators = require("../validators/activity.validators");
const { recordActivity } = require("../services/activity.service");

const router = express.Router();

router.post(
    "/",
    authUser,
    authorizeRoles("customer"),
    ...activityValidators,
    validateRequest,
    async (req, res, next) => {
        try {
            const { event, duplicate } = await recordActivity({
                userId: req.user._id,
                eventId: req.body.eventId,
                type: req.body.type,
                productId: req.body.productId,
                query: req.body.query,
            });
            return res.status(duplicate ? 200 : 201).json({
                activity: {
                    id: event._id,
                    eventId: event.eventId,
                    type: event.type,
                    productId: event.product,
                    query: event.query,
                    createdAt: event.createdAt,
                },
                duplicate,
            });
        } catch (error) {
            return next(error);
        }
    }
);

module.exports = router;
