import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { Resizable } from "re-resizable";
import { BsPhone } from "react-icons/bs";
import { IoClose, IoSend } from "react-icons/io5";
import type { Socket } from "socket.io-client";
import { useSelector } from "react-redux";

type Size = {
  width: number;
  height: number;
};

const CallWidget: React.FC<{
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

  // const { messages, sendMessage, fetchRoomCalls } = { messages: [],sendMessage:()=>{} };

  const callBodyRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // fetchRoomCalls();
        }
      },
      {
        root: callBodyRef.current,
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

    // sendMessage(newMessage);

    setNewMessage("");
  };

  useEffect(() => {
    if (!callBodyRef.current) return;

    callBodyRef.current.scrollTop = callBodyRef.current.scrollHeight;
  }, []);

  return (
    <>
      <button
        className={`btn btn-lg btn-circle bg-slate-700 border-none shadow-2xl shadow-gray-700 widgetToggle ${showWidget ? "hide" : "show"}`}
        onClick={(e) => {
          e.preventDefault();
          setShowWidget((curr: Boolean) => !curr);
        }}
      >
        <BsPhone size={25} color="#fff" />
      </button>

      <div className={`call-panel ${showWidget ? "show" : "hide"}`}>
        <div className="call-header">
          <h2>Room Call</h2>
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => {
              setShowWidget((curr: Boolean) => !curr);
            }}
          >
            <IoClose size={16} />
          </button>
        </div>
        <Resizable
          size={size}
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
              className="flex flex-col overflow-y-scroll"
              ref={callBodyRef}
              style={{ flex: 1 }}
            >
              <div ref={topSentinelRef} className="h-1" />
              {/* {messages?.map(({ _id, message, sender }) => {
                let cls = `call-bubble max-w-[40%] wrap-break-word text-sm flex flex-col ${sender._id == userId ? "ms-auto text-end" : "self-start text-start"}`;

                return (
                  <div key={_id} className="px-4 py-1 flex w-full relative">
                    <div className={cls}>
                      <p>{message}</p>
                      <span
                        className={`text-xs bottom-0 text-gray-400 overflow-hidden`}
                      >
                        {sender.name}
                      </span>
                    </div>
                  </div>
                );
              })} */}
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

export default CallWidget;
