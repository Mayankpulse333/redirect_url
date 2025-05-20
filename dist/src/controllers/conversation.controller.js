"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationController = void 0;
const slack_service_1 = require("../services/slack.service");
class ConversationController {
    constructor() {
        this.getConversations = async (_, res) => {
            try {
                const conversations = await this.slackService.getConversations();
                res.status(200).json({
                    success: true,
                    ...conversations,
                });
            }
            catch (error) {
                console.error("Error fetching conversations:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to fetch conversations",
                });
            }
        };
        this.slackService = slack_service_1.SlackService.getInstance();
    }
}
exports.ConversationController = ConversationController;
