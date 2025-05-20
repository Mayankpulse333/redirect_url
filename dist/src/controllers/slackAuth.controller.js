"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackController = void 0;
const slack_service_1 = require("../services/slack.service");
class SlackController {
    constructor() {
        this.getAuthPage = (_, res) => {
            const url = this.slackService.getAuthUrl();
            res.status(200).header("Content-Type", "text/html; charset=utf-8").send(`
      <html>
        <body>
          <a href="${url}">
            <img 
              alt="Add to Slack" 
              height="40" 
              width="139" 
              src="https://platform.slack-edge.com/img/add_to_slack.png" 
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" 
            />
          </a>
        </body>
      </html>
    `);
        };
        this.handleCallback = async (req, res) => {
            try {
                const code = req.query.code;
                if (!code) {
                    throw new Error("No code provided in callback");
                }
                const response = await this.slackService.handleOAuthCallback(code);
                res.status(200).send(`
        <html>
          <body>
            <h1>Success!</h1>
            <p>You have successfully logged in with your Slack account!</p>
            <h2>OAuth Response:</h2>
            <pre>${JSON.stringify(response, null, 2)}</pre>
          </body>
        </html>
      `);
            }
            catch (error) {
                console.error("Error in callback:", error);
                res.status(500).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>Something went wrong during the authentication process.</p>
            <pre>${error instanceof Error ? error.message : "Unknown error"}</pre>
          </body>
        </html>
      `);
            }
        };
        this.getHealth = (_, res) => {
            res.status(200).send("Slack Integration API is running");
        };
        this.slackService = slack_service_1.SlackService.getInstance();
    }
}
exports.SlackController = SlackController;
