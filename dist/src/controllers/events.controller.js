"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const slack_service_1 = require("../services/slack.service");
class EventsController {
    constructor() {
        this.handleEventVerification = async (req, res) => {
            const { challenge, event } = req.body;
            if (challenge) {
                res.status(200).json({ challenge });
            }
        };
        this.slackService = slack_service_1.SlackService.getInstance();
    }
}
exports.EventsController = EventsController;
