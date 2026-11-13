const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const userModel = require("../models/user-model");
const ownerModel = require("../models/owner-model");

const TOKEN_COOKIE = "token";
const TOKEN_LIFETIME = "7d";

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        if (process.env.NODE_ENV === "production") {
            const error = new Error("JWT_SECRET must be configured before authentication can be used.");
            error.status = 500;
            throw error;
        }
        return "development-jwt-secret-key-aurel-2025";
    }

    return process.env.JWT_SECRET;
}

function publicAccount(account) {
    const publicUser = {
        id: account._id,
        fullname: account.fullname,
        email: account.email,
        role: account.role,
        picture: account.picture || "",
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
        for (const key of ["fullname", "phoneNo", "preferences", "addresses", "picture"]) {
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

function getGoogleConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env["Client-ID"] || process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env["Client-secret"] || process.env.CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/google/callback";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!clientId) {
        throw new Error("Google Client ID is not configured.");
    }

    return { clientId, clientSecret, redirectUri, frontendUrl };
}

async function findOrCreateGoogleUser({ googleId, email, fullname, picture }) {
    let user = await userModel.findOne({
        $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
        let changed = false;
        if (!user.googleId && googleId) {
            user.googleId = googleId;
            changed = true;
        }
        if (picture && user.picture !== picture) {
            user.picture = picture;
            changed = true;
        }
        if (fullname && (!user.fullname || user.fullname === user.email.split("@")[0])) {
            user.fullname = fullname;
            changed = true;
        }
        if (changed) {
            await user.save();
        }
        return user;
    }

    user = await userModel.create({
        fullname: fullname || email.split("@")[0],
        email: email.toLowerCase(),
        googleId,
        picture: picture || "",
    });

    return user;
}

function initiateGoogleAuth(req, res) {
    try {
        const { clientId, redirectUri } = getGoogleConfig();
        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const options = {
            redirect_uri: redirectUri,
            client_id: clientId,
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
                "openid",
            ].join(" "),
        };
        const qs = new URLSearchParams(options);
        return res.redirect(`${rootUrl}?${qs.toString()}`);
    } catch (error) {
        console.error("Google OAuth initialization error:", error);
        return res.status(500).json({ message: error.message });
    }
}

async function googleAuthCallback(req, res, next) {
    let frontend = "http://localhost:5173";
    try {
        const { frontendUrl, clientId, clientSecret, redirectUri } = getGoogleConfig();
        frontend = frontendUrl;
        const code = req.query.code;

        if (!code) {
            const errorDesc = req.query.error || "Google authorization code missing";
            return res.redirect(`${frontend}/account?error=${encodeURIComponent(errorDesc)}`);
        }

        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }).toString(),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );

        const { access_token, id_token: googleIdToken } = tokenResponse.data;

        let googleId = "";
        let email = "";
        let fullname = "";
        let picture = "";

        try {
            const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: { Authorization: `Bearer ${access_token}` },
            });
            googleId = userInfoResponse.data.id;
            email = userInfoResponse.data.email;
            fullname = userInfoResponse.data.name;
            picture = userInfoResponse.data.picture;
        } catch (userInfoError) {
            console.warn("Could not retrieve userinfo endpoint data, will check id_token:", userInfoError.message);
        }

        if ((!email || !picture) && googleIdToken) {
            const decoded = jwt.decode(googleIdToken);
            if (decoded) {
                if (!googleId) googleId = decoded.sub;
                if (!email) email = decoded.email;
                if (!fullname) fullname = decoded.name;
                if (!picture) picture = decoded.picture;
            }
        }

        if (!email) {
            return res.redirect(`${frontend}/account?error=${encodeURIComponent("Could not retrieve email from Google")}`);
        }

        const user = await findOrCreateGoogleUser({ googleId, email, fullname, picture });

        setAuthCookie(res, user);

        return res.redirect(`${frontend}/`);
    } catch (error) {
        console.error("Google OAuth callback error:", error.response?.data || error.message);
        const message = error.response?.data?.error_description || error.message || "Failed to authenticate with Google.";
        return res.redirect(`${frontend}/account?error=${encodeURIComponent(message)}`);
    }
}

async function loginWithGoogleCredential(req, res, next) {
    try {
        const { credential, token } = req.body;
        const idToken = credential || token;

        if (!idToken) {
            return res.status(400).json({ message: "Google credential/token is required." });
        }

        const { clientId } = getGoogleConfig();

        const verificationResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const payload = verificationResponse.data;

        if (payload.aud !== clientId) {
            return res.status(401).json({ message: "Invalid Google token audience." });
        }

        const { sub: googleId, email, name: fullname, picture } = payload;

        if (!email) {
            return res.status(400).json({ message: "Email not provided by Google." });
        }

        const user = await findOrCreateGoogleUser({ googleId, email, fullname, picture });

        setAuthCookie(res, user);

        return res.status(200).json({ user: publicAccount(user) });
    } catch (error) {
        console.error("Google ID Token verification error:", error.response?.data || error.message);
        return res.status(401).json({
            message: "Unable to verify Google credentials. Please try signing in again.",
        });
    }
}

module.exports = {
    register,
    loginCustomer,
    loginOwner,
    logout,
    getProfile,
    updateProfile,
    publicAccount,
    initiateGoogleAuth,
    googleAuthCallback,
    loginWithGoogleCredential,
};
