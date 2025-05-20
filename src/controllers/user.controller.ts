import { Request, Response } from "express";
import { SlackService } from "../services/slack.service";

export class UserController {
  private slackService: SlackService;

  constructor() {
    this.slackService = SlackService.getInstance();
  }

  public getUserDetails = async (req: Request, res: Response) => {
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
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user details",
      });
    }
  };
}
