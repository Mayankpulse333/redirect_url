"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCodeVerifier = generateCodeVerifier;
exports.generateCodeChallenge = generateCodeChallenge;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config/config");
const slackAuth_controller_1 = require("./controllers/slackAuth.controller");
const conversation_controller_1 = require("./controllers/conversation.controller");
const user_controller_1 = require("./controllers/user.controller");
const channel_controller_1 = require("./controllers/channel.controller");
const events_controller_1 = require("./controllers/events.controller");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID;
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;
const INTERCOM_REDIRECT_URI = process.env.INTERCOM_REDIRECT_URI;
const app = (0, express_1.default)();
app.use(express_1.default.json());
const slackController = new slackAuth_controller_1.SlackController();
const conversationController = new conversation_controller_1.ConversationController();
const userController = new user_controller_1.UserController();
const channelController = new channel_controller_1.ChannelController();
const eventsController = new events_controller_1.EventsController();
console.log("MongoDB URI:", config_1.config.mongodb.uri);
// Connect to MongoDB
mongoose_1.default
    .connect(config_1.config.mongodb.uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
// Generate a secure random code_verifier
function generateCodeVerifier(length = 64) {
    // Allowed chars for code_verifier: A-Z, a-z, 0-9, "-", ".", "_", "~"
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let verifier = "";
    for (let i = 0; i < length; i++) {
        verifier += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return verifier;
}
// Convert code_verifier to code_challenge (base64url-encoded SHA256 hash)
function generateCodeChallenge(codeVerifier) {
    const hash = crypto_1.default.createHash("sha256").update(codeVerifier).digest();
    return hash
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
// Routes
app.get("/auth/slack", slackController.getAuthPage);
app.get("/auth/slack/callback", slackController.handleCallback);
app.get("/api/conversations", conversationController.getConversations);
app.get("/api/users", userController.getUserDetails);
app.get("/api/team", userController.getTeamDetails);
app.get("/api/channels/messages", channelController.getChannelMessages);
app.get("/", slackController.getHealth);
app.post("/events", eventsController.handleEventVerification);
app.get("/intercom/oauth/login", (req, res) => {
    const state = encodeURIComponent("tenant=zluri");
    const url = `https://app.intercom.com/oauth?client_id=${INTERCOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(INTERCOM_REDIRECT_URI || "")}&state=${state}`;
    console.log("[OAuth Login] Redirecting to:", url);
    const intercomOAuthUrl = url; // your Intercom OAuth URL
    res.status(200).header("Content-Type", "text/html; charset=utf-8").send(`
    <html>
      <body>
        <a href="${intercomOAuthUrl}">
          <img
            alt="Connect with Intercom"
            src="https://iconduck.com/assets/images/iconduck/intercom-8167-256.png"
            width="139"
            height="40"
          />
        </a>
      </body>
    </html>
  `);
});
// 2️⃣ Handle Intercom callback
app.get("/intercom/oauth/callback", async (req, res) => {
    var _a, _b;
    const { code, state } = req.query;
    console.log("[OAuth Callback] Received code:", code);
    console.log("[OAuth Callback] Received state:", state);
    console.log("[OAuth Callback] Session state:", (_a = req.session) === null || _a === void 0 ? void 0 : _a.state);
    if (!code) {
        console.warn("[OAuth Callback] Invalid state or missing code");
        res.status(400).send("Invalid state or missing code");
        return;
    }
    const stateParams = new URLSearchParams(state);
    const tenant = stateParams.get("tenant");
    console.log("[OAuth Callback] Tenant:", tenant);
    try {
        console.log("[OAuth Callback] Exchanging code for access token...");
        // const response = await axios.post(
        //   "https://api.intercom.io/auth/eagle/token",
        //   {
        //     client_id: INTERCOM_CLIENT_ID,
        //     client_secret: INTERCOM_CLIENT_SECRET,
        //     code,
        //     redirect_uri: INTERCOM_REDIRECT_URI,
        //     grant_type: "authorization_code",
        //   },
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //       Accept: "application/json",
        //     },
        //   }
        // );
        // const { access_token, token_type } = response.data;
        console.log("[OAuth Callback] Token exchange successful");
        // console.log("[OAuth Callback] Access Token:", access_token);
        // console.log("[OAuth Callback] Token Type:", token_type);
        // Persist token as needed (e.g., to DB)
        // res.json({ message: "Success", access_token, token_type });
        res.json({ code, message: "Successfully fetched" });
    }
    catch (error) {
        const errorMsg = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
        console.error("[OAuth Callback] Token exchange failed:", errorMsg);
        res.status(500).send("Token exchange failed");
    }
});
app.use("/webhook/read", express_1.default.raw({ type: "*/*" }));
app.post("/webhook/read", (req, res) => {
    try {
        console.log("📦 Headers:", JSON.stringify(req.headers, null, 2));
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2));
        console.log("📦 Payload:", JSON.stringify(req.query, null, 2));
        console.log("📦 Payload:", JSON.stringify(req.params, null, 2));
        res.status(200).json({
            success: true,
            status: "Received successfully",
        });
    }
    catch (err) {
        console.error("❌ Error processing webhook:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
const codeVerifierMap = new Map();
app.get("/productboard", (req, res) => {
    const state = encodeURIComponent("tenant=zluri");
    const clientId = "Q6apGyK-6HJDAYXEgDHkYNTRwm7JJWVtz6orqYemm7I";
    const redirectUri = encodeURIComponent("https://auth.staging.pulsegen.io/integration/productboard/callback");
    // 1. Generate verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    console.log("codeVerifier", codeVerifier);
    console.log("codeChallenge", codeChallenge);
    // 2. Store codeVerifier by state or session (here, by state)
    codeVerifierMap.set(state, codeVerifier);
    // 3. Construct OAuth URL
    const oauthUrl = `https://app.productboard.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    res.status(200).header("Content-Type", "text/html; charset=utf-8").send(`
    <html>
      <body>
        <a href="${oauthUrl}" target="_blank">Import features from Productboard</a>
      </body>
    </html>
  `);
});
app.get("/integration/productboard/callback", async (req, res) => {
    var _a;
    const { code, state } = req.query;
    // 1. Retrieve the code_verifier
    const codeVerifier = codeVerifierMap.get(state);
    console.log("codeVerifier", codeVerifier);
    console.log("code", code);
    console.log("state", state);
    if (!codeVerifier) {
        res.status(400).send("Missing code_verifier");
        return;
    }
    const clientId = "Q6apGyK-6HJDAYXEgDHkYNTRwm7JJWVtz6orqYemm7I";
    const clientSecret = "BSVdg_kMZWbQKniEm8k6VwBy75zlFD4JPNN1_SqHaGU";
    const redirectUri = "https://auth.staging.pulsegen.io/integration/productboard/callback";
    try {
        // 2. Exchange code for tokens
        const tokenResponse = await axios_1.default.post("https://api.productboard.com/oauth2/token", new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
            code_verifier: codeVerifier,
        }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        console.log("tokenResponse", tokenResponse.data);
        res.json(tokenResponse.data);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const errorResponse = ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || errorMessage;
        res.status(500).json({ error: errorResponse });
    }
});
app.post("/webhook/read/canny", (req, res) => {
    try {
        console.log("📦 Headers:", JSON.stringify(req.headers, null, 2));
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2));
        console.log("📦 Payload:", JSON.stringify(req.query, null, 2));
        console.log("📦 Payload:", JSON.stringify(req.params, null, 2));
        res.status(200).json({
            success: true,
            status: "Received successfully",
        });
    }
    catch (err) {
        console.error("❌ Error processing webhook:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Create HTTP server
const port = process.env.PORT || config_1.config.port;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
app.get("/clickup/oauth/callback", async (req, res) => {
    var _a, _b;
    const { code, state } = req.query;
    console.log("[OAuth Callback] Received code:", code);
    console.log("[OAuth Callback] Received state:", state);
    console.log("[OAuth Callback] Session state:", (_a = req.session) === null || _a === void 0 ? void 0 : _a.state);
    if (!code) {
        console.warn("[OAuth Callback] Invalid state or missing code");
        res.status(400).send("Invalid state or missing code");
        return;
    }
    const stateParams = new URLSearchParams(state);
    const tenant = stateParams.get("tenant");
    console.log("[OAuth Callback] Tenant:", tenant);
    try {
        console.log("[OAuth Callback] Exchanging code for access token...");
        // const response = await axios.post(
        //   "https://api.intercom.io/auth/eagle/token",
        //   {
        //     client_id: INTERCOM_CLIENT_ID,
        //     client_secret: INTERCOM_CLIENT_SECRET,
        //     code,
        //     redirect_uri: INTERCOM_REDIRECT_URI,
        //     grant_type: "authorization_code",
        //   },
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //       Accept: "application/json",
        //     },
        //   }
        // );
        // const { access_token, token_type } = response.data;
        console.log("[OAuth Callback] Token exchange successful");
        // console.log("[OAuth Callback] Access Token:", access_token);
        // console.log("[OAuth Callback] Token Type:", token_type);
        // Persist token as needed (e.g., to DB)
        // res.json({ message: "Success", access_token, token_type });
        res.json({ code, message: "Successfully fetched" });
    }
    catch (error) {
        const errorMsg = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
        console.error("[OAuth Callback] Token exchange failed:", errorMsg);
        res.status(500).send("Token exchange failed");
    }
});
