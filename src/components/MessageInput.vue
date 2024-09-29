<template>
  <div class="flex w-full border border-gray-200 rounded-lg mt-1 relative p-2 bg-white flex-col items-end rounded-b">
    <div v-if="isOpenEmoji" class="absolute bottom-10 left-8 z-10">
      <emoji-picker @emoji-click="onEmojiClick"></emoji-picker>
    </div>
    <div v-if="selectedReplyMessage"
      class=" absolute bottom-12 left-0 z-10 flex w-full gap-2 py-1 px-2 text-sm">
      <span class="[&>svg]:text-red-500 h-full px-1.5">
        <Reply color="#0B192C" :size="26" />
      </span>
      <div class="backdrop-blur rounded py-1 px-2 w-full border border-red-500/20 border-l-4 bg-red-400/10 border-l-red-500">
        <h3 class="font-semibold">{{ replyText }}</h3>
        <p class="text-sm">{{ originalMessage }}</p>
      </div>
    </div>
    <div class="flex w-full items-center gap-2">
      <button class="hover:bg-gray-200 transition-all duration-300 border border-gray-300 w-10 flex justify-center items-center h-full rounded-lg" @click="toggleEmojiPicker">
        <img src="@/assets/images/emoji.png" alt="Emoji" width="20" height="20" />
      </button>
      <input v-model="message" @keyup.enter="sendMessage" type="text" :placeholder="selectedReplyMessage ? `${replyText} to reply` : 'Start typing...'
        " class="flex-1 pl-3 py-2 rounded-md outline-none border border-gray-300" />
      <button @click="sendMessage" :disabled="!message"
        class="bg-blue-500 hover:bg-blue-700 active:bg-blue-400 transition-all duration-300 disabled:opacity-50 text-white px-4 py-2 rounded-md">
        <Loading v-if="isLoading" />
        <SendHorizontal v-else />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import Loading from "@/components/Loading.vue";
import { Reply, SendHorizontal } from "lucide-vue-next";

export default defineComponent({
  name: "MessageInput",
  components: {
    Reply,
    SendHorizontal,
    Loading,
  },
  props: {
    selectedReplyMessage: {
      type: Object as () => Record<string, any> | null,
      default: null,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const message = ref("");
    const isOpenEmoji = ref<boolean>(false);

    const replyText = computed(() =>
      props.selectedReplyMessage
        ? props.selectedReplyMessage.text.split("|||")[1]
        : ""
    );

    const originalMessage = computed(() =>
      props.selectedReplyMessage
        ? props.selectedReplyMessage.text.split("|||")[0]
        : ""
    );

    const sendMessage = () => {
      if (message.value.trim()) {
        emit("sendMessage", message.value);
        message.value = "";
      }
    };

    const onEmojiClick = (event: any) => {
      message.value += event.detail.unicode;
      isOpenEmoji.value = false;
    };

    const toggleEmojiPicker = () => {
      isOpenEmoji.value = !isOpenEmoji.value;
    };

    return {
      message,
      replyText,
      originalMessage,
      isOpenEmoji,
      sendMessage,
      toggleEmojiPicker,
      onEmojiClick
    };
  },
});
</script>