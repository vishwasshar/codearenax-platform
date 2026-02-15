import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { Resizable } from "re-resizable";
import { BsChatSquareText } from "react-icons/bs";
import { IoClose, IoSend } from "react-icons/io5";
import type { Socket } from "socket.io-client";
import { useChat } from "../hooks/useChat";
import { useSelector } from "react-redux";

type Size = {
  width: number;
  height: number;
};

const ChatWidget: React.FC<{
  socket: Socket;
  showWidget: Boolean;
  setShowWidget: any;
  roomId: string | undefined;
}> = ({ socket, roomId, showWidget, setShowWidget }) => {
  const { userId } = useSelector((state: any) => state?.user);

  const [size, setSize] = useState<Size>({
    width: 400,
    height: 300,
  });

  const [newMessage, setNewMessage] = useState<string>("");

  const { messages, sendMessage, fetchRoomChats } = useChat(socket, roomId);

  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchRoomChats();
        }
      },
      {
        root: chatBodyRef.current,
        threshold: 1,
      },
    );

    if (topSentinelRef.current) {
      observer.observe(topSentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
        className={`btn btn-lg btn-circle bg-slate-700 border-none shadow-2xl shadow-gray-700 widgetToggle ${showWidget ? "hide" : "show"}`}
        onClick={(e) => {
          e.preventDefault();
          setShowWidget((curr: Boolean) => !curr);
        }}
      >
        <BsChatSquareText size={25} color="#fff" />
      </button>

      <div className={`chat-panel ${showWidget ? "show" : "hide"}`}>
        <div className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Room Chat</h2>
          <button
            className="btn btn-xs btn-circle btn-ghost"
            onClick={() => {
              setShowWidget((curr: Boolean) => !curr);
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
            <div
              className="flex-1 flex flex-col overflow-y-auto p-3 gap-2"
              ref={chatBodyRef}
              style={{ flex: 1 }}
            >
              <div ref={topSentinelRef} className="h-1" />
              {messages?.map(({ _id, message, sender }) => {
                const isOwn = sender._id === userId;

                return (
                  <div
                    key={_id}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                        isOwn
                          ? "bg-success/80 text-white"
                          : "bg-gray-800 text-gray-200"
                      }`}
                    >
                      <p>{message}</p>
                      <span className="text-[10px] opacity-60">
                        {sender.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              className="flex items-center gap-2 p-3 bg-gray-900 border-t border-gray-700"
              onSubmit={handleFormSubmit}
            >
              <input
                type="text"
                value={newMessage}
                className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-white outline-none border border-gray-700 focus:border-gray-500"
                onChange={(e) => {
                  setNewMessage(e.target.value);
                }}
              />
              <button
                type="submit"
                className="btn btn-circle bg-success/80 border-none"
              >
                <IoSend size={15} />
              </button>
            </form>
          </div>
        </Resizable>
      </div>
    </>
  );
};

export default ChatWidget;
