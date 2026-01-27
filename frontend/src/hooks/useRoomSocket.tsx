import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";

export const useRoomSocket = (token: string, roomId: string) => {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_CRDT_SOCKET_URL + "/room", {
      auth: { token },
      autoConnect: true,
    });
  }

  const socket = socketRef.current;

  useEffect(() => {
    if (!roomId || !socket) return;

    const handleError = (message: string) => {
      toast.error(message);
    };

    socket.emit("room:join", roomId);

    socket.on("room:error", handleError);

    return () => {
      socket.emit("room:leave", roomId);
      socket.off("room:error", handleError);
    };
  }, [socket, roomId]);

  return socket;
};
