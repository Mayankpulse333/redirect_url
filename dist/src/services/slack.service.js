"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const web_api_1 = require("@slack/web-api");
const SlackAuth_1 = require("../models/SlackAuth");
const config_1 = require("../config/config");
class SlackService {
    constructor() {
        this.client = null;
        this.token = null;
    }
    static getInstance() {
        if (!SlackService.instance) {
            SlackService.instance = new SlackService();
        }
        return SlackService.instance;
    }
    async initializeClient() {
        try {
            if (!this.token) {
                this.token = await this.getFirstSlackAuthToken();
            }
            if (this.token && !this.client) {
                this.client = new web_api_1.WebClient(this.token, {
                    logLevel: web_api_1.LogLevel.DEBUG,
                });
            }
        }
        catch (error) {
            console.error("Error initializing Slack client:", error);
            throw error;
        }
    }
    async ensureClient() {
        if (!this.client) {
            await this.initializeClient();
        }
        if (!this.client) {
            throw new Error("Slack client not initialized. No valid token found.");
        }
        return this.client;
    }
    /**
     * Get the Slack OAuth authorization URL
     */
    getAuthUrl() {
        const scopes = [
            "app_mentions:read",
            "calls:read",
            "channels:history",
            "channels:join",
            "channels:read",
            "chat:write",
            "chat:write.public",
            "conversations.connect:manage",
            "conversations.connect:read",
            "groups:history",
            "groups:read",
            "links:read",
            "usergroups:read",
            "users:read",
            "mpim:read",
            "im:read",
        ].join(",");
        const state = encodeURIComponent("tenant=zluri");
        const url = `https://slack.com/oauth/v2/authorize?client_id=8231632623654.8920166575490&scope=app_mentions:read,calls:read,channels:history,channels:join,channels:read,chat:write,chat:write.public,conversations.connect:manage,conversations.connect:read,groups:history,groups:read,links:read,usergroups:read,users:read,mpim:read,im:read&user_scope=email&redirect_uri=${config_1.config.slack.redirectUri}`;
        return url;
        // return `https://slack.com/oauth/v2/authorize?client_id=${config.slack.clientId}&scope=${scopes}&user_scope=email&redirect_uri=${config.slack.redirectUri}&state=${state}`;
    }
    /**
     * Handle OAuth callback and save the response to database
     */
    async handleOAuthCallback(code, tenant) {
        var _a;
        try {
            // Create a temporary client for OAuth
            const tempClient = new web_api_1.WebClient();
            const response = await tempClient.oauth.v2.access({
                client_id: config_1.config.slack.clientId,
                client_secret: config_1.config.slack.clientSecret,
                code,
                redirect_uri: config_1.config.slack.redirectUri,
            });
            // Save to database
            const slackAuth = new SlackAuth_1.SlackAuth({
                ...response,
                tenant: tenant !== null && tenant !== void 0 ? tenant : "NA",
            });
            await slackAuth.save();
            // Update token and reinitialize client
            this.token = ((_a = response.authed_user) === null || _a === void 0 ? void 0 : _a.access_token) || null;
            this.client = null; // Force client reinitialization
            await this.initializeClient();
            return response;
        }
        catch (error) {
            console.error("Error in OAuth callback:", error);
            throw error;
        }
    }
    /**
     * Get list of conversations
     */
    async getConversations(limit = 1000) {
        var _a;
        try {
            const client = await this.ensureClient();
            const allConversations = [];
            let cursor = undefined;
            let count = 0;
            do {
                count++;
                const result = await client.conversations.list({
                    limit,
                    types: "private_channel,public_channel",
                    cursor: cursor,
                });
                if (result.channels) {
                    allConversations.push(...result.channels);
                }
                // Move to next page
                cursor = (_a = result.response_metadata) === null || _a === void 0 ? void 0 : _a.next_cursor;
            } while (cursor);
            return {
                length: allConversations.length,
                count: count,
                data: allConversations,
            };
        }
        catch (error) {
            console.error("Error fetching conversations:", error);
            throw error;
        }
    }
    /**
     * Get the first SlackAuth record's authed_user access token
     */
    async getFirstSlackAuthToken() {
        try {
            const firstAuth = await SlackAuth_1.SlackAuth.findOne().sort({ createdAt: -1 });
            return (firstAuth === null || firstAuth === void 0 ? void 0 : firstAuth.access_token) || null;
        }
        catch (error) {
            console.error("Error fetching SlackAuth token:", error);
            throw error;
        }
    }
    /**
     * Get user information from Slack
     */
    async getUserInfo(userId) {
        var _a, _b;
        try {
            const client = await this.ensureClient();
            const response = await client.users.info({ user: userId });
            let userResponse = response.user;
            if ((_a = userResponse === null || userResponse === void 0 ? void 0 : userResponse.profile) === null || _a === void 0 ? void 0 : _a.team) {
                const teamData = await this.getTeamInfo(userResponse.profile.team);
                if (userResponse.profile) {
                    userResponse.profile.team = teamData;
                }
            }
            return userResponse;
        }
        catch (err) {
            console.error(`Failed to get info for user ${userId}:`, ((_b = err.data) === null || _b === void 0 ? void 0 : _b.error) || err);
            return { id: userId, name: "Unknown" };
        }
    }
    /**
     * Get team information from Slack
     */
    async getTeamInfo(teamId) {
        var _a;
        try {
            const client = await this.ensureClient();
            const response = await client.team.info({ team: teamId });
            return response.team;
        }
        catch (err) {
            console.error(`Failed to get info for team ${teamId}:`, ((_a = err.data) === null || _a === void 0 ? void 0 : _a.error) || err);
            return { id: teamId, name: "Unknown" };
        }
    }
    /**
     * Fetch all messages with threads from a channel
     */
    async getChannelMessagesWithThreads(channelId) {
        var _a, _b, _c, _d;
        try {
            const client = await this.ensureClient();
            const fullMessageData = [];
            let count = 0;
            let cursor = undefined;
            do {
                count++;
                // Fetch a page of messages with the current cursor
                const result = await client.conversations.history({
                    channel: channelId,
                    limit: 1000,
                    cursor: cursor,
                });
                const messages = result.messages || [];
                for (const message of messages) {
                    const enrichedMessage = { ...message };
                    // Fetch replies if it's a thread starter
                    if (message.thread_ts && message.thread_ts === message.ts) {
                        try {
                            const repliesResponse = await client.conversations.replies({
                                channel: channelId,
                                ts: message.thread_ts,
                            });
                            const replies = ((_a = repliesResponse === null || repliesResponse === void 0 ? void 0 : repliesResponse.messages) === null || _a === void 0 ? void 0 : _a.slice(1)) || []; // skip the thread starter
                            enrichedMessage.thread = replies;
                        }
                        catch (err) {
                            console.error(`Error fetching thread for ts ${message.ts}:`, ((_b = err.data) === null || _b === void 0 ? void 0 : _b.error) || err);
                        }
                    }
                    fullMessageData.push(enrichedMessage);
                }
                // Move to next page
                cursor = (_c = result.response_metadata) === null || _c === void 0 ? void 0 : _c.next_cursor;
            } while (cursor);
            return {
                length: fullMessageData.length,
                count: count,
                data: fullMessageData,
            };
        }
        catch (error) {
            console.error("Error fetching channel messages:", ((_d = error.data) === null || _d === void 0 ? void 0 : _d.error) || error);
            throw error;
        }
    }
}
exports.SlackService = SlackService;
