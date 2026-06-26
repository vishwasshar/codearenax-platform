import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type ConnectionState = "connected" | "connecting" | "disconnected" | "reconnecting";

export const useSocketConnection = (socket: Socket | null) => {
  const [state, setState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setState("connected");
    const onDisconnect = () => setState("disconnected");
    const onReconnectAttempt = () => setState("reconnecting");
    const onConnectError = () => setState("connecting");

    if (socket.connected) {
      setState("connected");
    } else {
      setState("connecting");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("connect_error", onConnectError);
    };
  }, [socket]);

  return state;
};
