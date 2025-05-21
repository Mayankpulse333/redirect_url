"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const slack_service_1 = require("../services/slack.service");
class EventsController {
    constructor() {
        this.handleEventVerification = async (req, res) => {
            const { type, challenge, event } = req.body;
            console.log("Body Data : ", req.body);
            // URL Verification challenge from Slack
            if (type === "url_verification") {
                res.status(200).send({ challenge });
                return;
            }
            // Handle actual events
            if (type === "event_callback") {
                console.log("Event received:", event);
                // Example: reply to app mention
                if (event.type === "app_mention") {
                    // Send a response using Web API if needed
                    console.log(`Mentioned by ${event.user}: ${event.text}`);
                }
                res.sendStatus(200);
                return;
            }
            res.status(200).json({ message: req.body });
        };
        this.slackService = slack_service_1.SlackService.getInstance();
    }
}
exports.EventsController = EventsController;
