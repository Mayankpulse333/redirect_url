import { Request, Response } from "express";
import { SlackService } from "../services/slack.service";

export class SlackController {
  private slackService: SlackService;

  constructor() {
    this.slackService = SlackService.getInstance();
  }

  public getAuthPage = (_: Request, res: Response) => {
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

  public handleCallback = async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query as {
        code: string;
        state: string;
      };
      if (!code) {
        throw new Error("No code provided in callback");
      }

      // Parse tenant from state parameter
      const stateParams = new URLSearchParams(state);
      const tenant = stateParams.get("tenant");

      const response = await this.slackService.handleOAuthCallback(
        code,
        tenant
      );

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
    } catch (error) {
      console.error("Error in callback:", error);
      res.status(500).send(`
        <html>
          <body>
            <h1>Error</h1>
            <p>Something went wrong during the authentication process.</p>
            <pre>${
              error instanceof Error ? error.message : "Unknown error"
            }</pre>
          </body>
        </html>
      `);
    }
  };

  public getHealth = (_: Request, res: Response) => {
    res.status(200).send("Slack Integration API is running");
  };
}
