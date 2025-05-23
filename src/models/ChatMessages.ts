import mongoose, { Document, Schema } from "mongoose";
import { ChatMessageSource } from "../enums/ChatMessage";

interface IBlock {
  type: string;
  block_id: string;
  elements: any[]; // Slack block elements structure can be complex, use any[] unless you define types
}

export interface IChatMessage extends Document {
  tenant: string;
  users: {
    id: string;
    name: string;
  };
  subtype: string;
  type: string;
  client_msg_id: string;
  source: ChatMessageSource;
  ts: string; // Slack's timestamp
  team: {
    id: string;
    name: string;
  };
  bot_profile: object;
  text: string;
  channel: string;
  reply_users: string[];
  reply_count: number;
  reply_users_count: number;
  latest_reply: string;
  thread_ts?: string;
  thread?: object[]; // Can be improved if thread structure is defined
  blocks?: IBlock[];
  edited?: {
    user: string;
    ts: string;
  };
}

const chatMessageSchema = new Schema<IChatMessage>({
  tenant: { type: String, required: true },

  // To ease up ai to get Data of user
  users: {
    id: { type: String, required: true },
    name: { type: String },
  },

  // Its is reply/submessage/message
  subtype: { type: String },
  type: { type: String, required: true },
  client_msg_id: { type: String },

  // If in future mutiple messages so we are able to differentiate
  source: { type: String, required: true, enum: ChatMessageSource },

  // Primary key for fetching data
  ts: { type: String, required: true },

  // To ease up ai to keep track of workplace
  team: {
    id: { type: String, required: true },
    name: { type: String },
  },

  // Not much useful just keept it.
  bot_profile: { type: Schema.Types.Mixed },
  text: { type: String },
  channel: { type: String, required: true },
  reply_users: { type: [String], default: [] },
  reply_count: { type: Number },
  reply_users_count: { type: Number },
  latest_reply: { type: String },

  thread_ts: { type: String },

  // It keeps whole thread of data.
  thread: { type: [Schema.Types.Mixed], default: [] },

  // To keep layout of Data
  blocks: { type: [Schema.Types.Mixed], default: [] },

  // To keep track of changes
  edited: {
    user: { type: String },
    ts: { type: String },
  },
});

const db = mongoose.connection.useDb("DataDev");
const ChatMessage = db.model<IChatMessage>("chat_message", chatMessageSchema);

export default ChatMessage;
