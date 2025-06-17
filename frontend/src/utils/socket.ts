import { io, Socket } from "socket.io-client";

let socket: Socket | null;

export const createSocket = (token: string): Socket | null => {
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
  });

  return socket;
};

export const getSocket = () => socket;
