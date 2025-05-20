import { Request, Response } from "express";
import { SlackService } from "../services/slack.service";

export class ConversationController {
  private slackService: SlackService;

  constructor() {
    this.slackService = SlackService.getInstance();
  }

  public getConversations = async (_: Request, res: Response) => {
    try {
      const conversations = await this.slackService.getConversations();
      res.status(200).json({
        success: true,
        ...conversations,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch conversations",
      });
    }
  };
}
