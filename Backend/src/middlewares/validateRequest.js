const { validationResult } = require("express-validator");

// Return express-validator details before the controller receives invalid input.
module.exports = function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Request validation failed.",
            errors: errors.array(),
        });
    }

    return next();
};
