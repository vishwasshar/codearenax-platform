import { useDraggable } from "@dnd-kit/core";
import React, { useEffect, useRef, useState, type FormEvent } from "react";
import type { Corner } from "../commons/vars/corner-types";
import { Resizable } from "re-resizable";
import { BsChatSquareText } from "react-icons/bs";
import { IoClose, IoSend } from "react-icons/io5";
import type { Socket } from "socket.io-client";
import { useChat } from "../hooks/useChat";

const SNAP_OFFSET = 16;

const cornerStyles: Record<Corner, React.CSSProperties> = {
  "top-left": { top: SNAP_OFFSET, left: SNAP_OFFSET },
  "top-right": { top: SNAP_OFFSET, right: SNAP_OFFSET },
  "bottom-left": { bottom: SNAP_OFFSET, left: SNAP_OFFSET },
  "bottom-right": { bottom: SNAP_OFFSET, right: SNAP_OFFSET },
};

type Size = {
  width: number;
  height: number;
};

const FloatingWidget: React.FC<{
  corner: Corner;
  socket: Socket;
  roomId: string | undefined;
}> = ({ corner, socket, roomId }) => {
  const [showWidget, setShowWidget] = useState<Boolean>(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "chat-panel",
  });

  const [size, setSize] = useState<Size>({
    width: 400,
    height: 300,
  });

  const [newMessage, setNewMessage] = useState<string>("");

  // const [sampleData, setSampleData] = useState<ChatMessage[]>([
  //   { message: "Hi", sender: "you" },
  //   { message: "Hola", sender: "you" },
  //   { message: "Hi", sender: "other" },
  //   { message: "Como estas!", sender: "other" },
  //   {
  //     message: "This is the big message written by me to test responsiveness",
  //     sender: "you",
  //   },
  // ]);

  const { messages, sendMessage } = useChat(socket, roomId);

  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage) return;

    sendMessage(newMessage);

    setNewMessage("");
  };

  useEffect(() => {
    if (!chatBodyRef.current) return;

    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages]);

  return (
    <>
      <button
        className={`btn btn-lg btn-circle bg-slate-700 border-none absolute z-50 shadow-2xl shadow-gray-700 widgetToggle ${showWidget ? "hide" : "show"}`}
        style={{
          ...cornerStyles[corner],
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          e.preventDefault();
          setShowWidget((curr) => !curr);
        }}
      >
        <BsChatSquareText size={25} color="#fff" />
      </button>

      <div
        className={`chat-panel ${showWidget ? "show" : "hide"}`}
        style={{
          ...cornerStyles[corner],
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        }}
        ref={setNodeRef}
        {...attributes}
      >
        <div className="chat-header" {...listeners}>
          <h2>Room Chat</h2>
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => {
              setShowWidget((curr) => !curr);
            }}
          >
            <IoClose size={16} />
          </button>
        </div>
        <Resizable
          size={size}
          minHeight={400}
          minWidth={200}
          enable={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
          onResizeStop={(_, __, dom, delta) => {
            const maxWidth =
              (dom.parentElement?.parentElement?.clientWidth || 0) * 0.5;
            const maxHeight =
              (dom.parentElement?.parentElement?.clientHeight || 0) * 0.7;

            setSize((sz) => {
              const newWidth = sz.width + delta.width;
              const newHeight = sz.height + delta.height;

              return {
                height: newHeight > maxHeight ? maxHeight : newHeight,
                width: newWidth > maxWidth ? maxWidth : newWidth,
              };
            });
          }}
        >
          <div className="h-full flex flex-col bg-black">
            <div className="chat-body" ref={chatBodyRef} style={{ flex: 1 }}>
              {messages?.map(({ id, message, sender }) => {
                let cls = `chat ${sender == "you" ? "chat-end" : "chat-start"}`;

                return (
                  <div key={id} className={cls}>
                    <div className="chat-bubble">{message}</div>
                  </div>
                );
              })}
            </div>
            <form
              className="message-form w-full flex justify-center items-center gap-2 py-2 px-4"
              onSubmit={handleFormSubmit}
            >
              <input
                type="text"
                value={newMessage}
                className="input outline-0 flex-1 border-0 focus:outline-0 focus:border-0 bg-[#1a1a1a] "
                onChange={(e) => {
                  setNewMessage(e.target.value);
                }}
              />
              <button type="submit" className="btn btn-circle">
                <IoSend size={15} />
              </button>
            </form>
          </div>
        </Resizable>
      </div>
    </>
  );
};

export default FloatingWidget;
