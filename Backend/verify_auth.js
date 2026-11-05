const axios = require('axios');
const http = require('http');
// Build a cookie jar manual implementation for axios since we can't easily install new packages
let cookie = "";

const client = axios.create({
    baseURL: 'http://localhost:3000',
    validateStatus: () => true, // Handle all statuses manually
    maxRedirects: 0, // Handle redirects manually
});

async function runTest() {
    try {
        console.log("1. Registering User...");
        const regRes = await client.post('/users/register', {
            fullname: "Test User",
            email: "test@example.com",
            password: "password123"
        });
        console.log(`Register Status: ${regRes.status}`);
        console.log(`Register Body: ${regRes.data}`);

        // Capture cookie if set on register (implementation did set it)
        const setCookie = regRes.headers['set-cookie'];
        if (setCookie) {
            cookie = setCookie[0].split(';')[0];
            console.log("Cookie received:", cookie);
        }

        console.log("\n2. Logging In...");
        const loginRes = await client.post('/users/login', {
            email: "test@example.com",
            password: "password123"
        });
        console.log(`Login Status: ${loginRes.status}`);
        // If login sets cookie (it should)
        if (loginRes.headers['set-cookie']) {
            cookie = loginRes.headers['set-cookie'][0].split(';')[0];
            console.log("Cookie updated:", cookie);
        }

        console.log("\n3. Accessing Protected Route (WITH Cookie)...");
        const profileRes = await client.get('/users/profile', {
            headers: { Cookie: cookie }
        });
        console.log(`Profile Status: ${profileRes.status}`);
        console.log(`Profile Data: ${profileRes.data}`);

        console.log("\n4. Accessing Protected Route (WITHOUT Cookie)...");
        const noCookieRes = await client.get('/users/profile');
        console.log(`No-Cookie Profile Status: ${noCookieRes.status} (Expected 302 Redirect to /)`);

    } catch (e) {
        console.error("Test failed:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
}

// We need to run this while server is running.
// Since we are in agent environment, I'll rely on the agent to start server in background and then run this.
// But wait, I can't start background server easily and wait for it in same step.
// I will create this file, then I will use run_command with background to start server, then run this.

if (require.main === module) {
    runTest();
}
