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
const profileSchema = new mongoose_1.Schema({
    title: { type: String, default: "" },
    phone: { type: String, default: "" },
    skype: { type: String, default: "" },
    real_name: { type: String, default: "" },
    display_name: { type: String, default: "" },
    team: { type: String },
}, { _id: false });
const chatUserSchema = new mongoose_1.Schema({
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
const db = mongoose_1.default.connection.useDb("DataDev");
const ChatUser = db.model("chat_user", chatUserSchema);
exports.default = ChatUser;
