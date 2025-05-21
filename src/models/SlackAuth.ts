import mongoose, { Document } from "mongoose";
import { SlackOAuthResponse } from "../interfaces/slack.interface";

/**
 * Interface representing a SlackAuth document in MongoDB
 */
export interface ISlackAuth
  extends Document,
    Omit<SlackOAuthResponse, "enterprise"> {
  enterprise: any; // Using any for enterprise as it can be null or have varying structure
  createdAt: Date;
  tenant: string;
}

/**
 * Mongoose schema for SlackAuth
 */
const slackAuthSchema = new mongoose.Schema<ISlackAuth>({
  ok: { type: Boolean, required: true },
  app_id: { type: String, required: true },
  tenant: { type: String, required: true },
  authed_user: {
    id: { type: String, required: true },
    scope: { type: String, required: true },
    access_token: { type: String, required: true },
    token_type: { type: String, required: true },
  },
  scope: { type: String, required: true },
  token_type: { type: String, required: true },
  access_token: { type: String, required: true },
  bot_user_id: { type: String, required: true },
  team: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  enterprise: { type: mongoose.Schema.Types.Mixed },
  is_enterprise_install: { type: Boolean, required: true },
  response_metadata: {
    scopes: [{ type: String }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for frequently queried fields
slackAuthSchema.index({ "team.id": 1 });
slackAuthSchema.index({ "authed_user.id": 1 });
slackAuthSchema.index({ createdAt: -1 });

export const SlackAuth = mongoose.model<ISlackAuth>(
  "SlackAuth",
  slackAuthSchema
);
