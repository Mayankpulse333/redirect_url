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
const app = (0, express_1.default)();
const slackController = new slackAuth_controller_1.SlackController();
const conversationController = new conversation_controller_1.ConversationController();
const userController = new user_controller_1.UserController();
const channelController = new channel_controller_1.ChannelController();
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
// Create HTTP server
const port = process.env.PORT || config_1.config.port;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
