interface ReplyMessage {
    id: number;
    message_unique_id: string;
    message: string;
    sender_id: number;
  }
  
  interface MessagePayload {
    chat_room_id: number;
    message: string;
    reply_message: ReplyMessage | null;
  }
  
  interface Message {
    action: string;
    payload: MessagePayload;
  }
  
  class WebSocketService {
    private socket: WebSocket | null = null;
  
    constructor(private token: string, private onOpen: () => void) {}
  
    connect(onMessage: (data: any) => void) {
      this.socket = new WebSocket(`ws://5.182.26.58:4321/ws/web?token=${this.token}`);
  
      this.socket.onopen = (event) => {
        console.log("WebSocket connection opened", event);
        this.onOpen();
      };
  
      this.socket.onmessage = (event) => {
        if (event && event.data) {
          const data = JSON.parse(event.data);
          onMessage(data);
        }
      };
  
      this.socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
  
      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }
  
    sendMessage(message: Message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        console.error("WebSocket is not open");
      }
    }
  
    close() {
      if (this.socket) {
        this.socket.close();
      }
    }
  }
  
  export default WebSocketService;
  