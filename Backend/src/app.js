const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cookieParser = require("cookie-parser");

const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");
const usersRouter = require("./routes/usersRouter");
const ordersRouter = require("./routes/ordersRouter");
const authController = require("./controllers/auth.controller");

const app = express();

// Enable CORS with credentials for local dev and frontend clients
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "Public")));
app.use(cookieParser());

// Top-level Google OAuth routes matching Google Cloud Console redirect URI
// e.g. http://localhost:3000/auth/google/callback
app.get("/auth/google", authController.initiateGoogleAuth);
app.get("/auth/google/callback", authController.googleAuthCallback);
app.post("/auth/google", authController.loginWithGoogleCredential);

app.use("/owners", ownersRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

// Centralize unexpected route errors without exposing internal details.
app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
        return next(error);
    }
    return res.status(error.status || 500).json({
        message: error.status ? error.message : "Internal server error.",
    });
});

module.exports = app;
