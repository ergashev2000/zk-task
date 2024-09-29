<template>
       <div class="flex w-full border border-gray-200 rounded-lg relative p-4 bg-white flex-col items-end rounded-b">
      <div v-if="selectedReplyMessage"
        class="bg-red-500/10 w-full backdrop-blur border-l-4 border-red-500 absolute bottom-full left-0 mb-2 flex gap-2  rounded py-1 px-2 text-sm">
        <span class="[&>svg]:text-red-500">
          <Reply color="#0B192C" :size="16" />
        </span>
        <div>
          <h3 class="font-semibold">{{ selectedReplyMessage?.text.split("|||")?.[1] }}</h3>
          <p class="text-sm">
            {{ selectedReplyMessage?.text.split("|||")?.[0] }}
          </p>
        </div>
      </div>
      <input v-model="message" @keyup.enter="sendMessage" type="text"
        :placeholder="selectedReplyMessage ? `${selectedReplyMessage.text.split('|||')?.[1]} to reply` : 'Start typing...'"
        class="flex-1 pl-3 py-2 rounded-md outline-none" />
      <button class="hover:bg-gray-100 p-2 rounded-lg" @click="toggleEmojiPicker">
        <img src="../assets/images/emoji.png" alt="Emoji" width="20" height="20" />
      </button>
      <button @click="sendMessage" :disabled="!message"
        class="ml-2 bg-blue-500 hover:bg-blue-700 active:bg-blue-400 transition-all duration-300 disabled:opacity-50 text-white px-4 py-2 rounded-r-md">
        <Loading v-if="isLoading" />
        <SendHorizontal v-else />
      </button>
    </div>
</template>
<script>
export default {

}
</script>
