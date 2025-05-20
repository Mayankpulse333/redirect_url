import express from "express";
import mongoose from "mongoose";
import { config } from "./src/config/config";
import { SlackController } from "./src/controllers/slackAuth.controller";
import { ConversationController } from "./src/controllers/conversation.controller";
import { UserController } from "./src/controllers/user.controller";
import { ChannelController } from "./src/controllers/channel.controller";
import { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();
const slackController = new SlackController();
const conversationController = new ConversationController();
const userController = new UserController();
const channelController = new ChannelController();

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
app.get("/api/channels/messages", channelController.getChannelMessages);
app.get("/", slackController.getHealth);

// Create HTTP server
const port = process.env.PORT || config.port;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default (req: VercelRequest, res: VercelResponse) => {
  app(req as any, res as any);
};
