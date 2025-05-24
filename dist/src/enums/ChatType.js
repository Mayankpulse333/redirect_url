"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSubType = exports.ChatType = void 0;
var ChatType;
(function (ChatType) {
    ChatType["MESSAGE"] = "message";
})(ChatType || (exports.ChatType = ChatType = {}));
var ChatSubType;
(function (ChatSubType) {
    ChatSubType["MESSAGE_CHANGED"] = "message_changed";
    ChatSubType["MESSAGE_DELETED"] = "message_deleted";
})(ChatSubType || (exports.ChatSubType = ChatSubType = {}));
