import type { Socket } from "socket.io-client";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useOnline } from "../hooks/useOnline";

interface Props {
  socket: Socket | null;
}

const ConnectionStatusBanner = ({ socket }: Props) => {
  const isOnline = useOnline();
  const connectionState = useSocketConnection(socket);

  if (!isOnline) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-error/20 text-error border-b border-error/30">
        <span className="loading loading-ring loading-xs" />
        You are offline. Changes will not sync until connection is restored.
      </div>
    );
  }

  if (connectionState === "reconnecting") {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-warning/20 text-warning border-b border-warning/30">
        <span className="loading loading-ring loading-xs" />
        Connection lost. Reconnecting...
      </div>
    );
  }

  if (connectionState === "connecting") {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-info/20 text-info border-b border-info/30">
        <span className="loading loading-ring loading-xs" />
        Connecting...
      </div>
    );
  }

  if (connectionState === "disconnected") {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-error/20 text-error border-b border-error/30">
        <span className="loading loading-ring loading-xs" />
        Disconnected. Please check your connection.
      </div>
    );
  }

  return null;
};

export default ConnectionStatusBanner;
