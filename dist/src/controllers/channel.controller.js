"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelController = void 0;
const slack_service_1 = require("../services/slack.service");
class ChannelController {
    constructor() {
        this.getChannelMessages = async (req, res) => {
            try {
                const { channelId, latest } = req.query;
                if (!channelId || typeof channelId !== "string") {
                    res.status(400).json({
                        success: false,
                        error: "Channel ID is required and must be a string",
                    });
                    return;
                }
                if (!latest || typeof latest !== "string") {
                    res.status(400).json({
                        success: false,
                        error: "Latest is required and must be a string",
                    });
                    return;
                }
                const messages = await this.slackService.getChannelMessagesWithThreads(channelId, latest);
                res.status(200).json({
                    success: true,
                    ...messages,
                });
            }
            catch (error) {
                console.error("Error fetching channel messages:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to fetch channel messages",
                });
            }
        };
        this.slackService = slack_service_1.SlackService.getInstance();
    }
}
exports.ChannelController = ChannelController;
