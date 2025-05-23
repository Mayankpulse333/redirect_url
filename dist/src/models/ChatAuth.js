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
const chatAuthSchema = new mongoose_1.Schema({
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
const db = mongoose_1.default.connection.useDb("DataDev");
const ChatAuth = db.model("chat_auth", chatAuthSchema);
exports.default = ChatAuth;
