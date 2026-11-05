const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");
const ownerModel = require("../models/owner-model");

const TOKEN_COOKIE = "token";
const TOKEN_LIFETIME = "7d";

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        const error = new Error("JWT_SECRET must be configured before authentication can be used.");
        error.status = 500;
        throw error;
    }

    return process.env.JWT_SECRET;
}

function publicAccount(account) {
    const publicUser = {
        id: account._id,
        fullname: account.fullname,
        email: account.email,
        role: account.role,
    };
    if (account.role === "customer") {
        Object.assign(publicUser, {
            phoneNo: account.phoneNo,
            preferences: account.preferences,
            addresses: account.addresses || [],
            wishlist: account.wishlist || [],
            createdAt: account.createdAt,
        });
    }
    return publicUser;
}

function setAuthCookie(res, account) {
    const token = jwt.sign(
        { id: account._id.toString(), role: account.role },
        getJwtSecret(),
        { expiresIn: TOKEN_LIFETIME }
    );

    res.cookie(TOKEN_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}

// Public signup always creates a customer; privileged roles are provisioned separately.
async function register(req, res, next) {
    try {
        const { fullname, email } = req.body;
        const password = req.body.password;
        const phoneNo = req.body.phoneNo;
        const dob = req.body.dob;

        getJwtSecret();

        const existingUser = await userModel.findOne({ email });
        const existingOwner = await ownerModel.findOne({ email });
        if (existingUser || existingOwner) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const account = await userModel.create({
            fullname,
            email,
            password: await bcrypt.hash(password, 12),
            phoneNo: phoneNo?.trim(),
            dob,
        });

        setAuthCookie(res, account);
        return res.status(201).json({ user: publicAccount(account) });
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

// Keep customer and staff login endpoints separate while sharing credential checks.
function loginWithModel(accountModel) {
    return async function (req, res, next) {
        try {
            const { email, password } = req.body;

            getJwtSecret();

            const account = await accountModel.findOne({ email }).select("+password");
            if (!account || !(await bcrypt.compare(password, account.password))) {
                return res.status(401).json({ message: "Email or password is incorrect." });
            }

            setAuthCookie(res, account);
            return res.status(200).json({ user: publicAccount(account) });
        } catch (error) {
            return next(error);
        }
    };
}

const loginCustomer = loginWithModel(userModel);
const loginOwner = loginWithModel(ownerModel);

// Clearing the same cookie options ensures browsers remove the authentication token.
function logout(req, res) {
    res.clearCookie(TOKEN_COOKIE, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ message: "Logged out successfully." });
}

function getProfile(req, res) {
    const { _id, fullname, email, role, picture, phoneNo, preferences, addresses, wishlist } = req.user;
    return res.status(200).json({
        user: {
            id: _id,
            fullname,
            email,
            role,
            picture,
            phoneNo,
            preferences,
            addresses,
            wishlist: wishlist || [],
            createdAt: req.user.createdAt,
        },
    });
}

async function updateProfile(req, res, next) {
    try {
        const updates = {};
        for (const key of ["fullname", "phoneNo", "preferences", "addresses"]) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        Object.assign(req.user, updates);
        await req.user.save();
        return getProfile(req, res);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return next(error);
    }
}

module.exports = { register, loginCustomer, loginOwner, logout, getProfile, updateProfile, publicAccount };
