"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../../.env") });
// Validate MongoDB URI format
const validateMongoURI = (uri) => {
    console.log(uri);
    if (!uri)
        return false;
    try {
        new URL(uri);
        return true;
    }
    catch {
        return false;
    }
};
exports.config = {
    port: process.env.PORT || 3000,
    slack: {
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        redirectUri: process.env.SLACK_REDIRECT_URI ||
            "https://localhost:3000/auth/slack/callback",
    },
    mongodb: {
        uri: process.env.MONGODB_URI,
    },
};
// Validate required environment variables
const requiredEnvVars = [
    "SLACK_CLIENT_ID",
    "SLACK_CLIENT_SECRET",
    "MONGODB_URI",
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
// Validate MongoDB URI format
if (!validateMongoURI(exports.config.mongodb.uri)) {
    console.log("MogoDB URI : ", exports.config.mongodb.uri);
    throw new Error("Invalid MongoDB URI format. Please check your MONGODB_URI environment variable.");
}
