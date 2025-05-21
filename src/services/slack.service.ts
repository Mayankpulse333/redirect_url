import { WebClient, LogLevel } from "@slack/web-api";
import { SlackAuth } from "../models/SlackAuth";
import { config } from "../config/config";
import {
  SlackOAuthResponse,
  SlackTeam,
  SlackUser,
} from "../interfaces/slack.interface";

export class SlackService {
  private static instance: SlackService;
  private client: WebClient | null = null;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  private async initializeClient() {
    try {
      if (!this.token) {
        this.token = await this.getFirstSlackAuthToken();
      }

      if (this.token && !this.client) {
        this.client = new WebClient(this.token, {
          logLevel: LogLevel.DEBUG,
        });
      }
    } catch (error) {
      console.error("Error initializing Slack client:", error);
      throw error;
    }
  }

  private async ensureClient() {
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
  getAuthUrl(): string {
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

    const userScopes = [
      "channels:history",
      "channels:read",
      "channels:write",
      "groups:history",
      "groups:read",
      "identify",
      "im:history",
      "team:read",
      "usergroups:read",
      "users:read",
      "chat:write",
    ].join(",");

    const state = encodeURIComponent("tenant=zluri");

    return `https://slack.com/oauth/v2/authorize?client_id=${config.slack.clientId}&scope=${scopes}&redirect_uri=${config.slack.redirectUri}&state=${state}`;
  }

  /**
   * Handle OAuth callback and save the response to database
   */
  async handleOAuthCallback(
    code: string,
    tenant: string | null
  ): Promise<SlackOAuthResponse> {
    try {
      // Create a temporary client for OAuth
      const tempClient = new WebClient();
      const response = await tempClient.oauth.v2.access({
        client_id: config.slack.clientId as string,
        client_secret: config.slack.clientSecret as string,
        code,
        redirect_uri: config.slack.redirectUri,
      });

      // Save to database
      const slackAuth = new SlackAuth({
        ...response,
        tenant: tenant ?? "NA",
      });
      await slackAuth.save();

      // Update token and reinitialize client
      this.token = response.authed_user?.access_token || null;
      this.client = null; // Force client reinitialization
      await this.initializeClient();

      return response as SlackOAuthResponse;
    } catch (error) {
      console.error("Error in OAuth callback:", error);
      throw error;
    }
  }

  /**
   * Get list of conversations
   */
  async getConversations(limit: number = 1000): Promise<any> {
    try {
      const client = await this.ensureClient();
      const allConversations: any[] = [];
      let cursor: string | undefined = undefined;
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
        cursor = result.response_metadata?.next_cursor;
      } while (cursor);

      return {
        length: allConversations.length,
        count: count,
        data: allConversations,
      };
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  /**
   * Get the first SlackAuth record's authed_user access token
   */
  async getFirstSlackAuthToken(): Promise<string | null> {
    try {
      const firstAuth = await SlackAuth.findOne().sort({ createdAt: -1 });
      return firstAuth?.access_token || null;
    } catch (error) {
      console.error("Error fetching SlackAuth token:", error);
      throw error;
    }
  }

  /**
   * Get user information from Slack
   */
  async getUserInfo(userId: string): Promise<SlackUser> {
    try {
      const client = await this.ensureClient();
      const response = await client.users.info({ user: userId });

      let userResponse = response.user as SlackUser;
      if (userResponse?.profile?.team) {
        const teamData = await this.getTeamInfo(
          userResponse.profile.team as string
        );
        if (userResponse.profile) {
          userResponse.profile.team = teamData;
        }
      }
      return userResponse;
    } catch (err: any) {
      console.error(
        `Failed to get info for user ${userId}:`,
        err.data?.error || err
      );
      return { id: userId, name: "Unknown" } as SlackUser;
    }
  }

  /**
   * Get team information from Slack
   */
  async getTeamInfo(teamId: string): Promise<SlackTeam> {
    try {
      const client = await this.ensureClient();
      const response = await client.team.info({ team: teamId });
      return response.team as SlackTeam;
    } catch (err: any) {
      console.error(
        `Failed to get info for team ${teamId}:`,
        err.data?.error || err
      );
      return { id: teamId, name: "Unknown" };
    }
  }

  /**
   * Fetch all messages with threads from a channel
   */
  async getChannelMessagesWithThreads(channelId: string): Promise<any> {
    try {
      const client = await this.ensureClient();
      const fullMessageData: any[] = [];
      let count = 0;
      let cursor: string | undefined = undefined;

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

              const replies = repliesResponse?.messages?.slice(1) || []; // skip the thread starter
              (enrichedMessage as any).thread = replies;
            } catch (err: any) {
              console.error(
                `Error fetching thread for ts ${message.ts}:`,
                err.data?.error || err
              );
            }
          }

          fullMessageData.push(enrichedMessage);
        }

        // Move to next page
        cursor = result.response_metadata?.next_cursor;
      } while (cursor);

      return {
        length: fullMessageData.length,
        count: count,
        data: fullMessageData,
      };
    } catch (error: any) {
      console.error(
        "Error fetching channel messages:",
        error.data?.error || error
      );
      throw error;
    }
  }
}
