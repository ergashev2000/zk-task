<template>
  <div class="flex flex-col h-screen py-5 rounded-lg max-w-[36rem] mx-auto px-4">
    <div class="flex space-x-2 mb-2">
      <input v-model="token" type="text" placeholder="Enter your token"
        class="flex-1 py-2 px-4 border rounded-md border-gray-300" />
      <button @click="connect"
        class="bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-all duration-300 active:bg-green-400">
        Connect
      </button>
    </div>

    <div class="bg-white py-3 text-center border-b rounded-t-xl font-semibold">
      <h4 :class="isConnected ? 'text-green-500' : 'text-red-500'">
        {{ isConnected ? 'Online' : 'Offline' }}
      </h4>
    </div>

    <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 bg-white overflow-x-hidden chat_body">
      <TransitionGroup name="list" tag="div">
        <div v-for="msg in messages" :key="msg.message_unique_id" class="mb-4">
          <div class="flex gap-4" :class="{ 'flex-row-reverse': msg.sender_id === 25 }">
            <div class="min-w-10 max-w-10 h-10 rounded-full flex justify-center items-center overflow-hidden border">
              <img src="../assets/images/avatar_he.svg" alt="Avatar" class="w-full h-full object-cover"
                v-if="msg.sender_id === 25" />
              <img src="../assets/images/avatar_she.svg" alt="Avatar" class="w-full h-full object-cover" v-else />
            </div>
            <div
              :class="['relative bg-[#F2F2F7] px-4 pt-2 pb-4  w-2/3', msg.sender_id === 25 ? 'rounded-l-lg rounded-br-xl' : 'rounded-r-lg rounded-bl-xl']">
              <span :class="['message absolute top-0', msg.sender_id === 25 ? 'mirrored -right-3.5' : '-left-3.5']">
                <svg width="20" height="22" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 0C9 0 3.26206 0 1.8 0C0.33795 0 3.14713e-05 1.5 1.35003 3C2.70003 4.5 8.50063 9.5 9 11C9.49936 12.5 9 0 9 0Z"
                    fill="#F2F2F7" />
                </svg>
              </span>
              <h3 class="font-bold">{{ msg.sender }}</h3>
              <p class="font-medium text-sm">{{ msg.text }}</p>
              <span class="absolute bottom-1 right-2 font-medium text-sm">{{ msg.date }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
      
      <div v-if="!messages.length" class="h-full flex justify-center items-center">
        <img src="../assets/images/empty.png" alt="empty messages" width="150">
      </div>
    </div>

    <div v-if="isOpenEmoji" class="absolute bottom-10 left-8 z-10">
      <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
    </div>

    <div class="p-4 bg-white flex flex-col items-end rounded-b-xl">
      <div class="flex w-full border border-gray-200 rounded-lg">
        <button class="hover:bg-gray-100 p-2 rounded-lg" @click="toggleEmojiPicker">
          <img src="../assets/images/emoji.png" alt="Emoji" width="20" height="20" />
        </button>
        <input v-model="message" @keyup.enter="sendMessage" type="text" placeholder="Start typing..."
          class="flex-1 p-1 py-2 rounded-md outline-none" />
        <button @click="sendMessage" :disabled="!message"
          class="ml-2 bg-blue-500 hover:bg-blue-700 active:bg-blue-400 transition-all duration-300 disabled:opacity-50 text-white px-4 py-2 rounded-r-md">
          <SendHorizontal />
        </button>
      </div>
    </div>
  </div>
</template>



<script lang="ts">
import { SendHorizontal } from "lucide-vue-next";
import { defineComponent, ref, onBeforeUnmount, nextTick, useTemplateRef } from "vue";
import "emoji-picker-element";
import { toast } from 'vue3-toastify';
import WebSocketService from "@/services/WebSocketService";
import { getCurrectTime } from "@/utils/formatTime";

export default defineComponent({
  name: "ChatRoom",
  components: {
    SendHorizontal,
  },
  setup() {
    const token = ref<string>("");
    const message = ref<string>("");
    const isOpenEmoji = ref<boolean>(false);
    const isConnected = ref<boolean>(false);
    const messageContainer = useTemplateRef<HTMLDivElement | null>('messageContainer')

    const messages = ref<Array<{ sender: string; text: string; message_unique_id: string; date: string, sender_id: number | null }>>([]);

    let socketService: WebSocketService | null = null;

    const scrollToBottom = () => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight - messageContainer.value.clientHeight;
      }
    };

    const notify = (msg: string) => {
      toast(msg, {
        autoClose: 3000,
      });
    };

    const handleIncomingMessage = (data: any) => {
      if (!data || !data.action) return;

      const { action, data: chatData } = data;

      switch (action) {
        case "send_message_to_chat":
          const newMessage = {
            sender_id: chatData.sender_id || null,
            sender: chatData.sender_name || "Unknown",
            text: chatData.message || "No message text",
            message_unique_id: chatData.message_unique_id,
            date: getCurrectTime(),
          };
          messages.value.push(newMessage);
          break;

        case "send_online_users":
          const memberId = chatData.member_id;
          if (chatData.is_online) {
            isConnected.value = true;
            notify(`Foydalanuvchi (ID: ${memberId}) chatga kirdi.`);
          } else {
            isConnected.value = false;
            notify(`Foydalanuvchi (ID: ${memberId}) chatdan chiqib ketdi.`);
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
        notify("Chatga muvaffaqiyatli kirdingiz.");
      });

      socketService.connect((data: any) => {
        handleIncomingMessage(data);
      });
    };

    const sendMessage = () => {
      if (!message.value.trim()) return;

      const payload = {
        action: "send_message_to_chat",
        payload: {
          chat_room_id: 1,
          message: message.value,
          reply_message: null,
        },
      };

      socketService?.sendMessage(payload);
      message.value = "";
    };

    const toggleEmojiPicker = () => {
      isOpenEmoji.value = !isOpenEmoji.value;
    };

    const onEmojiClick = (event: any) => {
      message.value += event.detail.unicode;
      isOpenEmoji.value = false;
    };

    onBeforeUnmount(() => {
      socketService?.close();
    });

    return {
      token,
      message,
      messages,
      isOpenEmoji,
      isConnected,
      connect,
      sendMessage,
      toggleEmojiPicker,
      onEmojiClick,
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