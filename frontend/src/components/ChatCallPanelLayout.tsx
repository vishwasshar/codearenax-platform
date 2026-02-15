import { useDraggable } from "@dnd-kit/core";
import type { Corner } from "../commons/vars/corner-types";
import CallWidget from "./CallWidget";
import ChatWidget from "./ChatWidget";
import type React from "react";
import type { Socket } from "socket.io-client";
import { useEffect, useState } from "react";

const SNAP_OFFSET = 16;

const cornerStyles: Record<Corner, React.CSSProperties> = {
  "top-left": { top: SNAP_OFFSET, left: SNAP_OFFSET, alignItems: "flex-start" },
  "top-right": {
    top: SNAP_OFFSET,
    right: SNAP_OFFSET,
    alignItems: "flex-end",
  },
  "bottom-left": {
    bottom: SNAP_OFFSET,
    left: SNAP_OFFSET,
    alignItems: "flex-start",
  },
  "bottom-right": {
    bottom: SNAP_OFFSET,
    right: SNAP_OFFSET,
    alignItems: "flex-end",
  },
};

const ChatCallPanelLayout: React.FC<{
  corner: Corner;
  socket: Socket;
  roomMongooseId: string | undefined;
}> = ({ corner, socket, roomMongooseId }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "chat-call-panel",
  });

  const [showCallWidget, setShowCallWidget] = useState<boolean>(false);
  const [showChatWidget, setShowChatWidget] = useState<boolean>(false);

  useEffect(() => {
    if (showCallWidget) setShowChatWidget(false);
  }, [showCallWidget]);
  useEffect(() => {
    if (showChatWidget) setShowCallWidget(false);
  }, [showChatWidget]);

  return (
    <div
      className="absolute z-50 w-auto h-auto max-h-[95%] flex flex-col gap-2"
      style={{
        ...cornerStyles[corner],
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      id="chat-call-panel"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <CallWidget
        socket={socket}
        showWidget={showCallWidget}
        setShowWidget={setShowCallWidget}
      />
      <ChatWidget
        socket={socket}
        roomId={roomMongooseId}
        showWidget={showChatWidget}
        setShowWidget={setShowChatWidget}
      />
    </div>
  );
};

export default ChatCallPanelLayout;
