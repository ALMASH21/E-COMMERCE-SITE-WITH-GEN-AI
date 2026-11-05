const mongoose = require("mongoose");
const developmentConfig = require("./development.json");

// Use a complete environment URI when configured; otherwise use the local development database.
async function connectDatabase() {
    const mongoUri = process.env.MONGODB_URI || `${developmentConfig.MONGODB_URI}/fASTGIFT`;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");
}

module.exports = connectDatabase;
