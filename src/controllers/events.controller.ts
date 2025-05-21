import { Request, Response } from "express";

export class EventsController {
  public handleEventVerification = async (req: Request, res: Response) => {
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
}
