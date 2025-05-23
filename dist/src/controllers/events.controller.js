"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeChatMessageToDB = exports.getUserDataFromMongo = exports.EventsController = void 0;
const ChatAuth_1 = __importDefault(require("../models/ChatAuth"));
const ChatMessages_1 = __importDefault(require("../models/ChatMessages"));
const ChatUsers_1 = __importDefault(require("../models/ChatUsers"));
const ChatType_1 = require("../enums/ChatType");
const ChatMessage_1 = require("../enums/ChatMessage");
class EventsController {
    constructor() {
        this.handleEventVerification = async (req, res) => {
            const { type, challenge, event } = req.body;
            console.log("Body Data : ", req.body);
            // URL Verification challenge from Slack
            if (type === "url_verification") {
                res.status(200).send({ challenge });
                return;
            }
            await getSlackDataFromEventsListener(type, challenge, event, req.body.authorizations);
            res.status(200).json({ message: req.body });
        };
    }
}
exports.EventsController = EventsController;
const getChatAuthToken = async (botUserId) => {
    console.log(`[getChatAuthToken] Fetching auth token for bot user: ${botUserId}`);
    let authData;
    try {
        authData = await ChatAuth_1.default.findOne({
            bot_user_id: botUserId,
        });
    }
    catch (error) {
        console.error(`[getChatAuthToken] Error fetching auth token: ${error}`);
        throw new Error("[getChatAuthToken] Error fetching auth token:");
    }
    if (!authData) {
        console.warn(`[getChatAuthToken] No auth data found for bot user: ${botUserId}`);
        throw new Error("No auth data found for the bot user");
    }
    console.log(`[getChatAuthToken] Successfully retrieved auth token for bot user: ${botUserId}`);
    return authData;
};
const getSlackDataFromEventsListener = async (type, challenge, event, authorization) => {
    console.log(`[getSlackDataFromEventsListener] Processing event type: ${type}`);
    if (type === "url_verification") {
        console.log("[getSlackDataFromEventsListener] URL verification request received");
        return challenge;
    }
    const authData = await getChatAuthToken(authorization[0].user_id);
    const tenant = authData.tenant;
    console.log(`[getSlackDataFromEventsListener] Processing event for tenant: ${tenant}`);
    if (event) {
        let eventMsg;
        if (event.type == ChatType_1.ChatType.MESSAGE) {
            console.log(`[getSlackDataFromEventsListener] Processing message event, subtype: ${event.subtype}`);
            eventMsg = event;
            if (event.subtype == ChatType_1.ChatSubType.MESSAGE_CHANGED) {
                console.log(`[getSlackDataFromEventsListener] Processing message changed event for channel: ${event.channel}`);
                eventMsg = {
                    type: event.type,
                    subtype: ChatType_1.ChatSubType.MESSAGE_CHANGED,
                    ...event.message,
                    channel: event.channel,
                    ts: event.ts,
                    event_ts: event.ts,
                    channel_type: event.channel_type,
                };
            }
            await updateEventMessageOnDB(tenant, eventMsg);
        }
    }
};
exports.default = getSlackDataFromEventsListener;
const updateEventMessageOnDB = async (tenant, message) => {
    var _a;
    console.log(`[updateEventMessageOnDB] Updating message for tenant: ${tenant}, channel: ${message.channel}`);
    const userData = await (0, exports.getUserDataFromMongo)(message.user, tenant);
    console.log(`[updateEventMessageOnDB] Retrieved user data for user: ${message.user}`);
    let messageData, messageId = message.ts;
    if (message.thread_ts) {
        messageId = message.thread_ts;
        console.log(`[updateEventMessageOnDB] Processing thread message with ID: ${messageId}`);
    }
    messageData = await ChatMessages_1.default.findOne({
        tenant,
        channel: message.channel,
        source: ChatMessage_1.ChatMessageSource.SLACK,
        ts: messageId,
    });
    if (messageData) {
        console.log(`[updateEventMessageOnDB] Found existing message, updating content`);
        if (message.parent_user_id) {
            const existingThreadIndex = (_a = messageData.thread) === null || _a === void 0 ? void 0 : _a.findIndex((x) => x.ts === message.ts);
            if (existingThreadIndex !== -1 &&
                existingThreadIndex !== undefined &&
                messageData.thread) {
                console.log(`[updateEventMessageOnDB] Updating existing thread message at index: ${existingThreadIndex}`);
                messageData.thread[existingThreadIndex] = message;
            }
            else {
                console.log(`[updateEventMessageOnDB] Appending new message to thread`);
                messageData.thread = [...(messageData.thread || []), message];
            }
            messageData.thread_ts = message.thread_ts;
        }
        else {
            messageData.text = message.text;
            messageData.blocks = message.blocks;
            messageData.edited = message.edited;
        }
    }
    else {
        console.log(`[updateEventMessageOnDB] Creating new message entry`);
        messageData = {
            ...message,
            users: {
                id: message.user,
                name: userData.name,
            },
            team: userData.team.id == message.team
                ? userData.team
                : { id: message.team, name: "Unidentified" },
            source: ChatMessage_1.ChatMessageSource.SLACK,
            tenant,
        };
    }
    try {
        console.log(`[updateEventMessageOnDB] Writing message to database`);
        await (0, exports.writeChatMessageToDB)([messageData]);
        console.log(`[updateEventMessageOnDB] Successfully updated message in database`);
    }
    catch (error) {
        console.error(`[updateEventMessageOnDB] Error writing message to database: ${error}`);
        throw error;
    }
};
const getUserDataFromMongo = async (userId, tenant) => {
    try {
        console.log(`[Slack] Fetching user data for userId: ${userId} and tenant: ${tenant}`);
        const userData = await ChatUsers_1.default.findOne({
            id: userId,
            tenant: tenant,
        });
        if (!userData) {
            console.warn(`[Slack] No user data found for userId: ${userId} and tenant: ${tenant}`);
            return { id: userId, name: "Unidentified" };
        }
        console.log(`[Slack] Successfully retrieved user data for userId: ${userId}`);
        return userData;
    }
    catch (error) {
        console.error(`[Slack] Error retrieving user data for userId: ${userId}`, error);
        throw new Error("Error fetching user data from database");
    }
};
exports.getUserDataFromMongo = getUserDataFromMongo;
const writeChatMessageToDB = async (messages) => {
    const bulkOperations = messages.map((msg) => {
        return {
            updateOne: {
                filter: { ts: msg.ts, tenant: msg.tenant },
                update: msg,
                upsert: true,
            },
        };
    });
    console.log(`Writing ${bulkOperations.length} channels to DB`);
    if (bulkOperations.length > 0) {
        try {
            const bulkWriteResults = await ChatMessages_1.default.bulkWrite(bulkOperations, {
                ordered: false,
            });
            console.log("User data saved/updated successfully.");
            return bulkWriteResults;
        }
        catch (error) {
            throw new Error("Error saving data to DB");
        }
    }
};
exports.writeChatMessageToDB = writeChatMessageToDB;
