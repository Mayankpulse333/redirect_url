import express from "express";
import mongoose from "mongoose";
import { config } from "./config/config";
import { SlackController } from "./controllers/slackAuth.controller";
import { ConversationController } from "./controllers/conversation.controller";
import { UserController } from "./controllers/user.controller";
import { ChannelController } from "./controllers/channel.controller";
import { EventsController } from "./controllers/events.controller";
import axios from "axios";

const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID;
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;
const INTERCOM_REDIRECT_URI = process.env.INTERCOM_REDIRECT_URI;

const app = express();
const slackController = new SlackController();
const conversationController = new ConversationController();
const userController = new UserController();
const channelController = new ChannelController();
const eventsController = new EventsController();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(config.mongodb.uri)
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
  const url = `https://app.intercom.com/oauth?client_id=${INTERCOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    INTERCOM_REDIRECT_URI || ""
  )}`;

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
  const { code, state } = req.query;

  console.log("[OAuth Callback] Received code:", code);
  console.log("[OAuth Callback] Received state:", state);
  console.log("[OAuth Callback] Session state:", (req.session as any)?.state);

  if (!code) {
    console.warn("[OAuth Callback] Invalid state or missing code");
    res.status(400).send("Invalid state or missing code");
    return;
  }

  try {
    console.log("[OAuth Callback] Exchanging code for access token...");

    const response = await axios.post(
      "https://api.intercom.io/auth/eagle/token",
      {
        client_id: INTERCOM_CLIENT_ID,
        client_secret: INTERCOM_CLIENT_SECRET,
        code,
        redirect_uri: INTERCOM_REDIRECT_URI,
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const { access_token, token_type } = response.data;

    console.log("[OAuth Callback] Token exchange successful");
    console.log("[OAuth Callback] Access Token:", access_token);
    console.log("[OAuth Callback] Token Type:", token_type);

    // Persist token as needed (e.g., to DB)
    res.json({ message: "Success", access_token, token_type });
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    console.error("[OAuth Callback] Token exchange failed:", errorMsg);
    res.status(500).send("Token exchange failed");
  }
});

// Create HTTP server
const port = process.env.PORT || config.port;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
