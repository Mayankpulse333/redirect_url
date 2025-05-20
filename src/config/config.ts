import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Validate MongoDB URI format
const validateMongoURI = (uri: string) => {
  console.log(uri);
  if (!uri) return false;
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
};

export const config = {
  port: process.env.PORT || 3000,
  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    redirectUri:
      process.env.SLACK_REDIRECT_URI ||
      "https://localhost:3000/auth/slack/callback",
  },
  mongodb: {
    uri: process.env.MONGODB_URI as string,
  },
} as const;

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
if (!validateMongoURI(config.mongodb.uri)) {
  console.log("MogoDB URI : ", config.mongodb.uri);
  throw new Error(
    "Invalid MongoDB URI format. Please check your MONGODB_URI environment variable."
  );
}
