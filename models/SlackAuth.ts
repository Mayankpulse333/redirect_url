import mongoose from "mongoose";

const slackAuthSchema = new mongoose.Schema({
  ok: Boolean,
  app_id: String,
  authed_user: {
    id: String,
    scope: String,
    access_token: String,
    token_type: String,
  },
  scope: String,
  token_type: String,
  access_token: String,
  bot_user_id: String,
  team: {
    id: String,
    name: String,
  },
  enterprise: mongoose.Schema.Types.Mixed,
  is_enterprise_install: Boolean,
  response_metadata: {
    scopes: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const SlackAuth = mongoose.model("SlackAuth", slackAuthSchema);
