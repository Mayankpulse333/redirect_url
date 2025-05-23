"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ChatMessage_1 = require("../enums/ChatMessage");
const chatMessageSchema = new mongoose_1.Schema({
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
    source: { type: String, required: true, enum: ChatMessage_1.ChatMessageSource },
    // Primary key for fetching data
    ts: { type: String, required: true },
    // To ease up ai to keep track of workplace
    team: {
        id: { type: String, required: true },
        name: { type: String },
    },
    // Not much useful just keept it.
    bot_profile: { type: mongoose_1.Schema.Types.Mixed },
    text: { type: String },
    channel: { type: String, required: true },
    reply_users: { type: [String], default: [] },
    reply_count: { type: Number },
    reply_users_count: { type: Number },
    latest_reply: { type: String },
    thread_ts: { type: String },
    // It keeps whole thread of data.
    thread: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    // To keep layout of Data
    blocks: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    // To keep track of changes
    edited: {
        user: { type: String },
        ts: { type: String },
    },
});
const db = mongoose_1.default.connection.useDb("DataDev");
const ChatMessage = db.model("chat_message", chatMessageSchema);
exports.default = ChatMessage;
