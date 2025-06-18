"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config/config");
const slackAuth_controller_1 = require("./controllers/slackAuth.controller");
const conversation_controller_1 = require("./controllers/conversation.controller");
const user_controller_1 = require("./controllers/user.controller");
const channel_controller_1 = require("./controllers/channel.controller");
const events_controller_1 = require("./controllers/events.controller");
const axios_1 = __importDefault(require("axios"));
const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID;
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;
const INTERCOM_REDIRECT_URI = process.env.INTERCOM_REDIRECT_URI;
const app = (0, express_1.default)();
const slackController = new slackAuth_controller_1.SlackController();
const conversationController = new conversation_controller_1.ConversationController();
const userController = new user_controller_1.UserController();
const channelController = new channel_controller_1.ChannelController();
const eventsController = new events_controller_1.EventsController();
// Middleware
app.use(express_1.default.json());
// Connect to MongoDB
mongoose_1.default
    .connect(config_1.config.mongodb.uri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
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
        const response = await axios_1.default.post("https://api.intercom.io/auth/eagle/token", {
            client_id: INTERCOM_CLIENT_ID,
            client_secret: INTERCOM_CLIENT_SECRET,
            code,
            redirect_uri: INTERCOM_REDIRECT_URI,
            grant_type: "authorization_code",
        }, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const { access_token, token_type } = response.data;
        console.log("[OAuth Callback] Token exchange successful");
        console.log("[OAuth Callback] Access Token:", access_token);
        console.log("[OAuth Callback] Token Type:", token_type);
        // Persist token as needed (e.g., to DB)
        res.json({ message: "Success", access_token, token_type });
    }
    catch (error) {
        const errorMsg = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message;
        console.error("[OAuth Callback] Token exchange failed:", errorMsg);
        res.status(500).send("Token exchange failed");
    }
});
// Create HTTP server
const port = process.env.PORT || config_1.config.port;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
