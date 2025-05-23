import mongoose, { Document, Schema, Types } from "mongoose";
import {
  ChatChannelSource,
  ChatChannelType,
  ChatVisibility,
} from "../enums/ChatChannel";

export interface IChatChannel extends Document {
  _id: Types.ObjectId;
  tenant: string;
  id: string;
  name: string;

  source: ChatChannelSource;
  type: ChatChannelType;
  visibility: ChatVisibility;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  is_shared: boolean;
  is_org_shared: boolean;
  is_ext_shared: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: string[];
  context_team_id: string;
  updated: number;
  parent_conversation: string | null;
  creator: string;
  topic: string;
  purpose: string;
  previous_names: string[];
  num_members: number;
  created_at: Date;
  updated_at: Date;
  members: string[];
  organisations: Array<{
    id: string;
    name: string;
  }>;
}

const chatChannelSchema = new Schema<IChatChannel>({
  tenant: { type: String, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  source: { type: String, required: true, enum: ChatChannelSource },
  type: {
    type: String,
    required: true,
    enum: ChatChannelType,
  },
  visibility: {
    type: String,
    required: true,
    enum: ChatVisibility,
  },
  created: { type: Number, required: true },
  is_archived: { type: Boolean, default: false },
  is_general: { type: Boolean, default: false },
  is_shared: { type: Boolean, default: false },
  is_org_shared: { type: Boolean, default: false },
  is_ext_shared: { type: Boolean, default: false },
  is_pending_ext_shared: { type: Boolean, default: false },
  pending_shared: { type: [String], default: [] },
  context_team_id: { type: String, required: true },
  updated: { type: Number },
  parent_conversation: { type: String, default: null },
  creator: { type: String, required: true },
  topic: { type: String },
  purpose: { type: String },
  previous_names: { type: [String], default: [] },
  num_members: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now() },
  updated_at: { type: Date, default: Date.now() },

  // Externally fetched to keep track of user. In future it help use to differentiate org.
  members: { type: [String], default: [] },

  // To keep track of external and internal representative.
  organisations: [
    {
      _id: false,
      id: { type: String, required: true },
      name: { type: String },
    },
  ],
});

chatChannelSchema.pre<IChatChannel>("save", function (next) {
  this.updated_at = new Date(Date.now());
  next();
});

const db = mongoose.connection.useDb("DataDev");
const ChatChannel = db.model<IChatChannel>("chat_channel", chatChannelSchema);

export default ChatChannel;
