"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const slack_service_1 = require("../services/slack.service");
class UserController {
    constructor() {
        this.getUserDetails = async (req, res) => {
            try {
                const { userId } = req.query;
                if (!userId || typeof userId !== "string") {
                    res.status(400).json({
                        success: false,
                        error: "User ID is required and must be a string",
                    });
                    return;
                }
                const userDetails = await this.slackService.getUserInfo(userId);
                res.status(200).json({
                    success: true,
                    data: userDetails,
                });
            }
            catch (error) {
                console.error("Error fetching user details:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to fetch user details",
                });
            }
        };
        this.getTeamDetails = async (req, res) => {
            try {
                const { teamId } = req.query;
                if (!teamId || typeof teamId !== "string") {
                    res.status(400).json({
                        success: false,
                        error: "User ID is required and must be a string",
                    });
                    return;
                }
                const teamDetails = await this.slackService.getTeamInfo(teamId);
                res.status(200).json({
                    success: true,
                    data: teamDetails,
                });
            }
            catch (error) {
                console.error("Error fetching user details:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to fetch user details",
                });
            }
        };
        this.slackService = slack_service_1.SlackService.getInstance();
    }
}
exports.UserController = UserController;
