import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { Socket } from "socket.io-client";

type ChatMessage = {
  id: string;
  message: string;
  sender: string;
};

export const useChat = (socket: Socket, roomId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { userId } = useSelector((state: any) => state?.user);

  useEffect(() => {
    const handleNewMessage = (newMsg: ChatMessage) => {
      setMessages((curr) => [...curr, newMsg]);
    };

    const handleChatAck = (
      newMsg: {
        id: string;
        message: string;
        sender: string;
      },
      tmpId: string,
    ) => {
      setMessages((curr) => {
        return curr.map((msg) => {
          if (msg.id === tmpId) return newMsg;
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

    setMessages((curr) => [...curr, { id: tempId, message, sender: userId }]);
  };
  return { messages, sendMessage };
};
