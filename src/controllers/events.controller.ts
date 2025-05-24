import { Request, Response } from "express";
import ChatAuth, { IChatAuth } from "../models/ChatAuth";
import ChatMessage, { IChatMessage } from "../models/ChatMessages";
import ChatUser, { IChatUser } from "../models/ChatUsers";
import { ChatType, ChatSubType } from "../enums/ChatType";
import { ChatMessageSource } from "../enums/ChatMessage";

export class EventsController {
  public handleEventVerification = async (req: Request, res: Response) => {
    const { type, challenge, event } = req.body;
    console.log("Body Data : ", req.body);

    // URL Verification challenge from Slack
    if (type === "url_verification") {
      res.status(200).send({ challenge });
      return;
    }

    await getSlackDataFromEventsListener(
      type,
      challenge,
      event,
      req.body.authorizations
    );

    res.status(200).json({ message: req.body });
  };
}

const getChatAuthToken = async (botUserId: string): Promise<IChatAuth> => {
  console.log(
    `[getChatAuthToken] Fetching auth token for bot user: ${botUserId}`
  );
  let authData;

  try {
    authData = await ChatAuth.findOne({
      bot_user_id: botUserId,
    });
  } catch (error) {
    console.error(`[getChatAuthToken] Error fetching auth token: ${error}`);
    throw new Error("[getChatAuthToken] Error fetching auth token:");
  }

  if (!authData) {
    console.warn(
      `[getChatAuthToken] No auth data found for bot user: ${botUserId}`
    );
    throw new Error("No auth data found for the bot user");
  }

  console.log(
    `[getChatAuthToken] Successfully retrieved auth token for bot user: ${botUserId}`
  );
  return authData;
};

const getSlackDataFromEventsListener = async (
  type: any,
  challenge: any,
  event: any,
  authorization: any[]
) => {
  console.log(
    `[getSlackDataFromEventsListener] Processing event type: ${type}`
  );

  if (type === "url_verification") {
    console.log(
      "[getSlackDataFromEventsListener] URL verification request received"
    );
    return challenge;
  }

  const authData = await getChatAuthToken(authorization[0].user_id);
  const tenant = authData.tenant;
  console.log(
    `[getSlackDataFromEventsListener] Processing event for tenant: ${tenant}`
  );

  if (event) {
    let eventMsg;
    if (event.type == ChatType.MESSAGE) {
      console.log(
        `[getSlackDataFromEventsListener] Processing message event, subtype: ${event.subtype}`
      );
      eventMsg = event;
      if (event.subtype == ChatSubType.MESSAGE_CHANGED) {
        console.log(
          `[getSlackDataFromEventsListener] Processing message changed event for channel: ${event.channel}`
        );
        eventMsg = {
          type: event.type,
          subtype: ChatSubType.MESSAGE_CHANGED,
          ...event.message,
          channel: event.channel,
          ts: event.message.ts,
          event_ts: event.message.event_ts,
          channel_type: event.channel_type,
        };
      } else if (event.subtype == ChatSubType.MESSAGE_DELETED) {
        eventMsg = {
          type: event.type,
          subtype: ChatSubType.MESSAGE_CHANGED,
          channel: event.channel,
          ...event.previous_message,
          ts: event.previous_message.ts,
          thread_ts: event.previous_message.thread_ts,
          event_ts: event.ts,
          channel_type: event.channel_type,
        };

        await deleteEventMessageDB(tenant, eventMsg);
        return;
      }
      await updateEventMessageOnDB(tenant, eventMsg);
    }
  }
};

export default getSlackDataFromEventsListener;

const updateEventMessageOnDB = async (tenant: string, message: any) => {
  console.log(
    `[updateEventMessageOnDB] Updating message for tenant: ${tenant}, channel: ${message.channel}`
  );

  const userData = await getUserDataFromMongo(message.user, tenant);
  console.log(
    `[updateEventMessageOnDB] Retrieved user data for user: ${message.user}`
  );

  let messageData,
    messageId = message.ts;

  if (message.thread_ts) {
    messageId = message.thread_ts;
    console.log(
      `[updateEventMessageOnDB] Processing thread message with ID: ${messageId}`
    );
  }

  messageData = await ChatMessage.findOne({
    tenant,
    channel: message.channel,
    source: ChatMessageSource.SLACK,
    ts: messageId,
  });

  if (messageData) {
    console.log(
      `[updateEventMessageOnDB] Found existing message, updating content`
    );
    if (message.parent_user_id) {
      const existingThreadIndex = messageData.thread?.findIndex(
        (x: any) => x.ts === message.ts
      );
      if (
        existingThreadIndex !== -1 &&
        existingThreadIndex !== undefined &&
        messageData.thread
      ) {
        console.log(
          `[updateEventMessageOnDB] Updating existing thread message at index: ${existingThreadIndex}`
        );
        messageData.thread[existingThreadIndex] = message;
      } else {
        console.log(`[updateEventMessageOnDB] Appending new message to thread`);
        messageData.thread = [...(messageData.thread || []), message];
      }

      messageData.thread_ts = message.thread_ts;
    } else {
      messageData.text = message.text;
      messageData.blocks = message.blocks;
      messageData.edited = message.edited;
    }
  } else {
    console.log(`[updateEventMessageOnDB] Creating new message entry`);
    messageData = {
      ...message,
      users: {
        id: message.user,
        name: userData.name,
      },
      team:
        userData.team.id == message.team
          ? userData.team
          : { id: message.team, name: "Unidentified" },
      source: ChatMessageSource.SLACK,
      tenant,
    };
  }

  try {
    console.log(`[updateEventMessageOnDB] Writing message to database`);
    await writeChatMessageToDB([messageData]);
    console.log(
      `[updateEventMessageOnDB] Successfully updated message in database`
    );
  } catch (error) {
    console.error(
      `[updateEventMessageOnDB] Error writing message to database: ${error}`
    );
    throw error;
  }
};

export const getUserDataFromMongo = async (
  userId: string,
  tenant: string
): Promise<IChatUser> => {
  try {
    console.log(
      `[Slack] Fetching user data for userId: ${userId} and tenant: ${tenant}`
    );

    const userData = await ChatUser.findOne({
      id: userId,
      tenant: tenant,
    });

    if (!userData) {
      console.warn(
        `[Slack] No user data found for userId: ${userId} and tenant: ${tenant}`
      );
      return { id: userId, name: "Unidentified" } as IChatUser;
    }

    console.log(
      `[Slack] Successfully retrieved user data for userId: ${userId}`
    );
    return userData;
  } catch (error: any) {
    console.error(
      `[Slack] Error retrieving user data for userId: ${userId}`,
      error
    );
    throw new Error("Error fetching user data from database");
  }
};

export const writeChatMessageToDB = async (
  messages: IChatMessage[]
): Promise<any> => {
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
      const bulkWriteResults = await ChatMessage.bulkWrite(bulkOperations, {
        ordered: false,
      });
      console.log("User data saved/updated successfully.");
      return bulkWriteResults;
    } catch (error: any) {
      throw new Error("Error saving data to DB");
    }
  }
};

const deleteEventMessageDB = async (tenant: string, message: any) => {
  const chatData = await ChatMessage.find({
    channel: message.channel,
    tenant: tenant,
    $or: [{ ts: message.ts }, { thread_ts: message.thread_ts }],
  });

  if (!chatData || chatData.length === 0) {
    throw new Error(`Chat Message not found on Db for : ${message} `);
  }

  if (message.parent_user_id) {
    // Find the parent message that contains the thread
    const parentMessage = chatData.find(
      (chat) => chat.thread_ts === message.thread_ts
    );

    if (parentMessage && parentMessage.thread) {
      // Find the index of the message to delete in the thread array
      const threadIndex = parentMessage.thread.findIndex(
        (threadMsg: any) => threadMsg.ts === message.ts
      );

      if (threadIndex !== -1) {
        // Remove the message from the thread array
        parentMessage.thread.splice(threadIndex, 1);

        // Update the database with the modified thread
        await ChatMessage.findByIdAndUpdate(parentMessage._id, {
          thread: parentMessage.thread,
        });

        console.log(
          `[deleteEventMessageDB] Successfully deleted thread message with ts: ${message.ts}`
        );
      }
    }
  } else {
    // For non-thread messages, delete the entire message
    await ChatMessage.deleteOne({
      tenant,
      channel: message.channel,
      ts: message.ts,
    });
    console.log(
      `[deleteEventMessageDB] Successfully deleted message with ts: ${message.ts}`
    );
  }
};
