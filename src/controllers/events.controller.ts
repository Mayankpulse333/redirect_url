import { SlackService } from "../services/slack.service";
import { Request, Response } from "express";

export class EventsController {
  private slackService: SlackService;

  constructor() {
    this.slackService = SlackService.getInstance();
  }

  public handleEventVerification = async (req: Request, res: Response) => {
    const { challenge } = req.body;

    if (challenge) {
      res.status(200).json({ challenge });
    }
  };
}
