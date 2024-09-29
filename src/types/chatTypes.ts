interface ReplyMessage {
  id: number;
  message_unique_id: string;
  message: string;
  sender_id: number;
}

interface Message {
  sender: string;
  text: string;
  message_unique_id: string;
  date: string;
  sender_id: number | null;
  isYou: boolean;
  reply_message: ReplyMessage | null;
}

interface SelectedReplyMessage {
  id: number;
  message_unique_id: string;
  text: string;
  sender_id: number;
}

export type { ReplyMessage, Message, SelectedReplyMessage };
