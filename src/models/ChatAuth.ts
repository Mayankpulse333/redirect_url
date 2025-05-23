import mongoose, { Document, Schema } from "mongoose";

export interface IChatAuth extends Document {
  tenant: string;
  app_id: string;
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
  scope: string;
  token_type: string; // "bot"
  access_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise: string | null;
  is_enterprise_install: boolean;
  response_metadata: {
    scopes: string[];
  };
}

const chatAuthSchema = new Schema<IChatAuth>({
  tenant: { type: String, required: true },
  app_id: { type: String, required: true },
  authed_user: {
    id: { type: String, required: true },
    scope: { type: String, required: true },
    access_token: { type: String, required: true },
    token_type: { type: String, required: true },
  },
  scope: { type: String, required: true },
  token_type: { type: String, required: true }, // Typically "bot"
  access_token: { type: String, required: true },
  bot_user_id: { type: String, required: true },
  team: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  enterprise: { type: String, default: null },
  is_enterprise_install: { type: Boolean, default: false },
  response_metadata: {
    scopes: { type: [String], default: [] },
  },
});

const db = mongoose.connection.useDb("DataDev");
const ChatAuth = db.model<IChatAuth>("chat_auth", chatAuthSchema);

export default ChatAuth;
