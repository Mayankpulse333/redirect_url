import express from "express";
import mongoose from "mongoose";
import { config } from "./config/config";
import { SlackController } from "./controllers/slackAuth.controller";
import { ConversationController } from "./controllers/conversation.controller";
import { UserController } from "./controllers/user.controller";
import { ChannelController } from "./controllers/channel.controller";
import { EventsController } from "./controllers/events.controller";
import axios from "axios";
import crypto from "crypto";

const INTERCOM_CLIENT_ID = process.env.INTERCOM_CLIENT_ID;
const INTERCOM_CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;
const INTERCOM_REDIRECT_URI = process.env.INTERCOM_REDIRECT_URI;

const app = express();
app.use(express.json());

const slackController = new SlackController();
const conversationController = new ConversationController();
const userController = new UserController();
const channelController = new ChannelController();
const eventsController = new EventsController();

console.log("MongoDB URI:", config.mongodb.uri);

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
  const state = encodeURIComponent("tenant=zluri");

  const url = `https://app.intercom.com/oauth?client_id=${INTERCOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    INTERCOM_REDIRECT_URI || ""
  )}&state=${state}`;

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

  const stateParams = new URLSearchParams(state as string);
  const tenant = stateParams.get("tenant") as string;

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
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    console.error("[OAuth Callback] Token exchange failed:", errorMsg);
    res.status(500).send("Token exchange failed");
  }
});

app.use("/webhook/read", express.raw({ type: "*/*" }));

app.post("/webhook/read", (req, res) => {
  try {
    console.log("📦 Headers:", JSON.stringify(req.headers, null, 2));
    console.log("📦 Payload:", req.body.toString());

    const secret = process.env.READ_WEBHOOK_SECRET!;
    const receivedSig = req.headers["x-read-signature"] as string;
    if (!receivedSig) {
      console.error("❌ Missing signature header");
      res.status(401).json({ error: "Missing signature" });
      return;
    }

    // Compute HMAC
    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    // Constant-time compare
    const bufReceived = Buffer.from(receivedSig, "hex");
    const bufExpected = Buffer.from(expected, "hex");
    const valid =
      bufReceived.length === bufExpected.length &&
      crypto.timingSafeEqual(bufReceived, bufExpected);

    if (!valid) {
      console.error("❌ Invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // ✅ Verified
    const data = JSON.parse(req.body.toString());
    // …handle data…

    res.status(200).json({ status: "Received successfully" });
  } catch (err: any) {
    console.error("❌ Error processing webhook:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Create HTTP server
const port = process.env.PORT || config.port;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/clickup/oauth/callback", async (req, res) => {
  const { code, state } = req.query;

  console.log("[OAuth Callback] Received code:", code);
  console.log("[OAuth Callback] Received state:", state);
  console.log("[OAuth Callback] Session state:", (req.session as any)?.state);

  if (!code) {
    console.warn("[OAuth Callback] Invalid state or missing code");
    res.status(400).send("Invalid state or missing code");
    return;
  }

  const stateParams = new URLSearchParams(state as string);
  const tenant = stateParams.get("tenant") as string;

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
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    console.error("[OAuth Callback] Token exchange failed:", errorMsg);
    res.status(500).send("Token exchange failed");
  }
});
