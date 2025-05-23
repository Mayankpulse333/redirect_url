import mongoose, { Document, Schema } from "mongoose";

export interface IChatTeam extends Document {
  id: string; // Slack team ID (e.g., "T075990FCQ2")
  tenant: string;
  source: string;
  name: string;
  url: string;
  email_domain: string;
  icon: string;
  avatar_base_url: string;
  domain: string;
  date_created: number;
}

const chatTeamSchema = new Schema<IChatTeam>({
  id: { type: String, required: true }, // Slack team ID
  tenant: { type: String, required: true },
  source: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, default: "" },
  email_domain: { type: String, default: "" },
  icon: { type: String },
  avatar_base_url: { type: String },
  domain: { type: String, required: true },
  date_created: { type: Number, required: true },
});

chatTeamSchema.index({ tenant: 1 });
chatTeamSchema.index({ tenant: 1, id: 1 });

const db = mongoose.connection.useDb("DataDev");
const ChatTeam = db.model<IChatTeam>("chat_team", chatTeamSchema);

export default ChatTeam;
