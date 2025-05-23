import mongoose, { Document, Schema } from "mongoose";

export interface IChatUser extends Document {
  id: string; // Slack user ID (e.g., U08STP7C2PQ)
  tenant: string;
  team: { id: string; name: string };
  source: string;
  name: string;
  deleted: boolean;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    title: string;
    phone: string;
    skype: string;
    real_name: string;
    display_name: string;
    team: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_app_user: boolean;
  updated: number;
}

const profileSchema = new Schema(
  {
    title: { type: String, default: "" },
    phone: { type: String, default: "" },
    skype: { type: String, default: "" },
    real_name: { type: String, default: "" },
    display_name: { type: String, default: "" },
    team: { type: String },
  },
  { _id: false }
);

const chatUserSchema = new Schema<IChatUser>({
  id: { type: String, required: true }, // Slack User ID
  tenant: { type: String, required: true }, // Slack User ID
  source: { type: String, required: true },
  team: {
    id: { type: String },
    name: { type: String },
  },
  name: { type: String },
  deleted: { type: Boolean, default: false },
  real_name: { type: String },
  tz: { type: String },
  tz_label: { type: String },
  tz_offset: { type: Number },
  profile: { type: profileSchema, required: true },
  is_admin: { type: Boolean, default: false },
  is_owner: { type: Boolean, default: false },
  is_primary_owner: { type: Boolean, default: false },
  is_app_user: { type: Boolean, default: false },
  updated: { type: Number },
});

chatUserSchema.index({ tenant: 1 });
chatUserSchema.index({ tenant: 1, id: 1 });

const db = mongoose.connection.useDb("DataDev");
const ChatUser = db.model<IChatUser>("chat_user", chatUserSchema);

export default ChatUser;
