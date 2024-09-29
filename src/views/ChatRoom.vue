<template>
  <div class="flex flex-col h-[100dvh] py-5 rounded max-w-[36rem] mx-auto px-4">
    <div class="flex space-x-2 mb-2">
      <input v-model="token" type="text" placeholder="Enter your token"
        class="flex-1 py-2 px-4 border rounded-md border-gray-300" @keyup.enter="connect" />
      <button @click="connect"
        class="bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-all duration-300 active:bg-green-400">
        Connect
      </button>
    </div>

    <div class="bg-white py-3 text-center border-b rounded-t font-semibold">
      <h3>Chat</h3>
      <p class="text-sm" :class="isConnected ? 'text-green-500' : 'text-red-500'">
        {{ isConnected ? 'Online' : 'Offline' }}
      </p>
    </div>

    <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 bg-white overflow-x-hidden chat_body rounded-b-md">
      <TransitionGroup name="list" tag="div">
        <div v-for="msg in messages" :key="msg.message_unique_id" class="mb-4">
          <div class="flex gap-4" :class="{ 'flex-row-reverse': msg?.isYou }">
            <div class="min-w-10 max-w-10 h-10 rounded-full flex justify-center items-center overflow-hidden border">
              <img src="../assets/images/avatar_he.svg" alt="Avatar" class="w-full h-full object-cover"
                v-if="msg?.isYou" />
              <img src="../assets/images/avatar_she.svg" alt="Avatar" class="w-full h-full object-cover" v-else />
            </div>
            <div
              :class="['relative group bg-[#F2F2F7] p-2 pt-2 pb-4  w-2/3', msg?.isYou ? 'rounded-l-lg rounded-br-xl' : 'rounded-r-lg rounded-bl-xl']">
              <span :class="['message absolute top-0', msg?.isYou ? 'mirrored -right-3.5' : '-left-3.5']">
                <svg width="20" height="22" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 0C9 0 3.26206 0 1.8 0C0.33795 0 3.14713e-05 1.5 1.35003 3C2.70003 4.5 8.50063 9.5 9 11C9.49936 12.5 9 0 9 0Z"
                    fill="#F2F2F7" />
                </svg>
              </span>
              <div v-if="msg?.reply_message"
                class="border-l-red-500  min-h-4 bg-red-500/10 flex gap-2 backdrop-blur rounded px-2 py-1 border-l-4 border-red-500/20 border">
                <span>
                  <Reply :size="18" />
                </span>
                <div>
                  <h3 class="font-semibold text-sm">{{ msg?.reply_message?.message.split("|||")?.[1] }}</h3>
                  <p class="text-xs">
                    {{ msg?.reply_message?.message.split("|||")?.[0] }}
                  </p>
                </div>
              </div>
              <div class="px-2 pt-1 relative ">
                <h3 class="font-bold">{{ msg.sender }}</h3>
                <p class="font-medium text-sm">{{ msg.text }}</p>
                <span class="absolute -bottom-2 right-2 font-medium text-xs">{{ msg.date }}</span>
                <button @click="selectReplyMessage(msg)"
                  class="font-semibold text-xs absolute transition-all duration-300 group-hover:opacity-100 opacity-0  rounded px-2 py-1 top-0 right-0">Reply</button>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
      <div v-if="!messages.length" class="h-full flex justify-center items-center">
        <img src="../assets/images/empty.png" alt="empty messages" width="150">
      </div>
    </div>

    <MessageInput :selectedReplyMessage="selectedReplyMessage" :isLoading="isLoading" @sendMessage="sendMessage" />
  </div>
</template>

<script lang="ts">
import { MessageSquareReply, Reply, SendHorizontal } from "lucide-vue-next";
import { defineComponent, ref, onBeforeUnmount, nextTick, useTemplateRef, onMounted, TransitionGroup } from "vue";
import { getCurrectTime } from "@/utils/formatTime";
import { generatedId } from "@/utils/generateId";
import WebSocketService from "@/services/WebSocketService";
import Loading from "@/components/Loading.vue";
import MessageInput from "@/components/MessageInput.vue";

import type { Message, SelectedReplyMessage } from "@/types/chatTypes";
import { notify } from "@/utils/notifications";
import "emoji-picker-element";

export default defineComponent({
  name: "ChatRoom",
  components: {
    SendHorizontal,
    MessageSquareReply,
    Reply,
    Loading,
    MessageInput,
    TransitionGroup
  },
  setup() {
    const token = ref<string>("");
    const ownId = ref<string>("");
    const isConnected = ref<boolean>(false);
    const isLoading = ref<boolean>(false);
    const messages = ref<Array<Message>>([]);
    const selectedReplyMessage = ref<SelectedReplyMessage | null>(null);

    const messageContainer = useTemplateRef<HTMLDivElement | null>('messageContainer')
    let socketService: WebSocketService | null = null;

    const scrollToBottom = () => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight - messageContainer.value.clientHeight;
      }
    };

    const handleIncomingMessage = (data: any) => {
      if (!data || !data.action) return;
      isLoading.value = false;
      const { action, data: chatData } = data;

      switch (action) {
        case "send_message_to_chat":
          const msg = chatData.message?.split("|||");
          const newMessage = {
            sender_id: chatData.sender_id || null,
            sender: chatData.sender_name || "Unknown",
            text: msg[0] || "No message text",
            message_unique_id: chatData.message_unique_id,
            isYou: msg[1] === ownId.value,
            date: getCurrectTime(),
            reply_message: chatData?.reply_message
          };
          messages.value.push(newMessage);
          break;
        case "send_online_users":
          const memberId = chatData.member_id;
          if (chatData.is_online) {
            isConnected.value = true;
            notify(`User (ID: ${memberId}) has joined the chat.`);
          } else {
            isConnected.value = false;
            notify(`User (ID: ${memberId}) has left the chat.`);
          }
          break;
        default:
          break;
      }

      nextTick(() => scrollToBottom());
    };

    const connect = () => {
      if (!token.value) {
        notify("Please enter your token.");
        return;
      }

      socketService = new WebSocketService(token.value, () => {
        isConnected.value = true;
        notify("You have successfully entered the chat.");
      });

      socketService.connect((data: any) => {
        handleIncomingMessage(data);
      });
    };

    onBeforeUnmount(() => {
      socketService?.close();
    });

    onMounted(() => {
      ownId.value = generatedId()
    });

    const selectReplyMessage = (msg: any) => {
      selectedReplyMessage.value = {
        id: msg.id,
        message_unique_id: msg.message_unique_id,
        text: `${msg.text}|||${msg.sender}`,
        sender_id: msg.sender_id,
      };
    };

    const sendMessage = (inputMessage: string) => {
      if (!inputMessage.trim()) return;
      if (!token.value.trim()) return notify("Please, enter your token!");
      isLoading.value = true;

      const payload = {
        action: "send_message_to_chat",
        payload: {
          chat_room_id: 1,
          message: `${inputMessage}|||${ownId.value}`,
          reply_message: selectedReplyMessage.value
            ? {
              id: selectedReplyMessage.value.id,
              message_unique_id: selectedReplyMessage.value.message_unique_id,
              message: selectedReplyMessage.value.text,
              sender_id: selectedReplyMessage.value.sender_id,
            }
            : null,
        },
      };

      socketService?.sendMessage(payload);
      selectedReplyMessage.value = null;
    };

    return {
      token,
      messages,
      isConnected,
      selectedReplyMessage,
      ownId,
      connect,
      sendMessage,
      selectReplyMessage,
      isLoading
    };
  },
});
</script>

<style>
.list-enter-active,
.list-leave-active {
  transition: opacity 0.5s;
}

.list-enter,
.list-leave-to {
  opacity: 0;
}

.emoji-picker {
  position: absolute;
  bottom: 10px;
  left: 8px;
}

.flex-row-reverse {
  flex-direction: row-reverse;
}

.mirrored {
  transform: scaleX(-1);
}
</style>