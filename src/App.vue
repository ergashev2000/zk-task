<template>
  <div>
    <ChatRoom />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ChatRoom from "./views/ChatRoom.vue";

export default defineComponent({
  name: "App",
  components: {
    ChatRoom,
  },
});
</script>