import { Request, Response } from "express";
import { SlackService } from "../services/slack.service";

export class ChannelController {
  private slackService: SlackService;

  constructor() {
    this.slackService = SlackService.getInstance();
  }

  public getChannelMessages = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.query;

      if (!channelId || typeof channelId !== "string") {
        res.status(400).json({
          success: false,
          error: "Channel ID is required and must be a string",
        });
        return;
      }

      const messages = await this.slackService.getChannelMessagesWithThreads(
        channelId
      );

      res.status(200).json({
        success: true,
        ...messages,
      });
    } catch (error) {
      console.error("Error fetching channel messages:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch channel messages",
      });
    }
  };
}
