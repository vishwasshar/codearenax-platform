import { useCallback, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

type ChatMessage = {
  id: string;
  message: string;
  sender: string;
};

export const useChat = (socket: Socket, roomId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const handleNewMessage = (newMsg: ChatMessage) => {
      setMessages((curr) => [...curr, newMsg]);
    };

    const handleChatAck = (newMsg: {
      tempId: string;
      id: string;
      message: string;
      sender: string;
    }) => {
      setMessages((curr) => {
        return curr.map((msg) => {
          if (msg.id === newMsg.tempId) {
            msg.id = newMsg.id;
            msg.sender = newMsg.sender;
          }
          return msg;
        });
      });
    };

    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:ack", handleChatAck);

    return () => {
      socket.off("chat:new-message", handleNewMessage);
      socket.off("chat:ack", handleChatAck);
    };
  }, []);

  const sendMessage = (message: string) => {
    const tempId = crypto.randomUUID();
    socket.emit("chat:send-message", { tempId, roomId, message });

    setMessages((curr) => [...curr, { id: tempId, message, sender: "you" }]);
  };
  return { messages, sendMessage };
};
