const app = require("./app");
const connectDatabase = require("./config/database");

const port = process.env.PORT || 3000;

connectDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`FasGifts backend listening on port ${port}.`);
        });
    })
    .catch((error) => {
        console.error("Unable to start FasGifts backend:", error.message);
        process.exitCode = 1;
    });
