"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackAuth = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Mongoose schema for SlackAuth
 */
const slackAuthSchema = new mongoose_1.default.Schema({
    ok: { type: Boolean },
    app_id: { type: String },
    tenant: { type: String },
    authed_user: {
        id: { type: String },
        scope: { type: String },
        access_token: { type: String },
        token_type: { type: String },
    },
    scope: { type: String },
    token_type: { type: String },
    access_token: { type: String },
    bot_user_id: { type: String },
    team: {
        id: { type: String },
        name: { type: String },
    },
    enterprise: { type: mongoose_1.default.Schema.Types.Mixed },
    is_enterprise_install: { type: Boolean },
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
exports.SlackAuth = mongoose_1.default.model("SlackAuth", slackAuthSchema);
