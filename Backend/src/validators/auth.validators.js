const { body } = require("express-validator");

// Keep auth request rules separate so route definitions stay concise.
const register = [
    body("fullname")
        .isString().withMessage("fullname must be text.")
        .bail()
        .trim()
        .isLength({ min: 3 }).withMessage("fullname must contain at least 3 characters."),
    body("email")
        .isString().withMessage("email must be text.")
        .bail()
        .trim()
        .isEmail().withMessage("email must be valid.")
        .normalizeEmail(),
    body("password")
        .isString().withMessage("password must be text.")
        .bail()
        .isLength({ min: 8 }).withMessage("password must contain at least 8 characters."),
    body("phoneNo")
        .optional()
        .isString().withMessage("phoneNo must be text.")
        .bail()
        .trim()
        .isLength({ min: 10 }).withMessage("phoneNo must contain at least 10 characters."),
    body("dob")
        .optional()
        .isISO8601().withMessage("dob must be a valid date.")
        .bail()
        .toDate(),
];

const login = [
    body("email")
        .isString().withMessage("email must be text.")
        .bail()
        .trim()
        .isEmail().withMessage("email must be valid.")
        .normalizeEmail(),
    body("password")
        .isString().withMessage("password must be text."),
];

const createAdmin = [
    body("fullname")
        .isString().withMessage("fullname must be text.")
        .bail()
        .trim()
        .isLength({ min: 3 }).withMessage("fullname must contain at least 3 characters."),
    body("email")
        .isString().withMessage("email must be text.")
        .bail()
        .trim()
        .isEmail().withMessage("email must be valid.")
        .normalizeEmail(),
    body("password")
        .isString().withMessage("password must be text.")
        .bail()
        .isLength({ min: 8 }).withMessage("password must contain at least 8 characters."),
];

module.exports = { register, login, createAdmin };
