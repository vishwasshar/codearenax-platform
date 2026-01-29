import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { Socket } from "socket.io-client";
import { authRequest } from "../utils/axios.interceptor";

type ChatMessage = {
  _id: string;
  message: string;
  sender: { _id?: string; name?: string };
};

type Cursor = {
  cursorCreatedAt?: Date;
  cursorId?: string;
};

export const useChat = (socket: Socket, roomId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { userId, name } = useSelector((state: any) => state?.user);
  const [loading, setLoading] = useState(false);
  const nextCursorRef = useRef<Cursor | null | undefined>(undefined);

  useEffect(() => {
    const handleNewMessage = (newMsg: ChatMessage) => {
      setMessages((curr) => [...curr, newMsg]);
    };

    const handleChatAck = (newMsg: ChatMessage, tmpId: string) => {
      setMessages((curr) => {
        return curr.map((msg) => {
          if (msg._id === tmpId) return newMsg;
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

    setMessages((curr) => [
      ...curr,
      { _id: tempId, message, sender: { _id: userId, name } },
    ]);
  };

  const fetchRoomChats = async () => {
    if (loading) return;

    if (nextCursorRef.current === null) return;

    try {
      setLoading(true);

      const query = nextCursorRef.current
        ? `?cursorCreatedAt=${nextCursorRef.current.cursorCreatedAt}&cursorId=${nextCursorRef.current.cursorId}`
        : "";

      const res = await authRequest.get(`/rooms/${roomId}/chat${query}`);

      if (res.status === 200) {
        nextCursorRef.current = res.data.nextCursor || null;

        res.data.chats.reverse();
        setMessages((curr) => [...res.data.chats, ...curr]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading, fetchRoomChats };
};
