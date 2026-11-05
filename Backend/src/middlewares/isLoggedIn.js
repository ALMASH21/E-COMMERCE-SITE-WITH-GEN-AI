const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");
const ownerModel = require("../models/owner-model");

// Accept the app's HTTP-only cookie and bearer tokens for API clients.
async function authUser(req, res, next) {
    const authorization = req.get("authorization");
    const bearerToken = authorization && authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
        return res.status(401).json({ message: "Authentication is required." });
    }
    if (!process.env.JWT_SECRET) {
        const error = new Error("JWT_SECRET must be configured before authentication can be used.");
        error.status = 500;
        return next(error);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Authentication token is invalid or expired." });
        }
        return next(error);
    }

    try {
        const isStaff = decoded.role === "owner" || decoded.role === "admin";
        const accountModel = isStaff ? ownerModel : userModel;
        const account = await accountModel.findById(decoded.id).select("-password");

        if (!account || account.role !== decoded.role) {
            return res.status(401).json({ message: "Authentication token is invalid." });
        }

        req.user = account;
        return next();
    } catch (error) {
        return next(error);
    }
}

// Use this after authUser to restrict a route to explicitly allowed roles.
function authorizeRoles(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to perform this action." });
        }
        return next();
    };
}

// Keep the default export callable for the existing server-rendered route.
module.exports = authUser;
module.exports.authUser = authUser;
module.exports.authorizeRoles = authorizeRoles;
