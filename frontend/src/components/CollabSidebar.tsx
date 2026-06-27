import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Socket } from "socket.io-client";
import type { editor } from "monaco-editor";
import { useChat } from "../hooks/useChat";
import useRoomCall from "../hooks/useRoomCall";
import { useActiveCollaborators } from "../hooks/useActiveCollaborators";
import { useSelector } from "react-redux";
import { IoSend } from "react-icons/io5";
import {
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
} from "react-icons/io5";
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from "react-icons/md";
import VideoTile from "./VideoTile";
import AudioRenderer from "./AudioRendered";
import CodeVitals from "./CodeVitals";

type Tab = "chat" | "call" | "people";

const AVATAR_COLORS = [
  "#ff6b6b", "#51cf66", "#339af0", "#f06595",
  "#cc5de8", "#ff922b", "#20c997", "#fcc419",
];

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "badge-warning" },
  editor: { label: "Editor", className: "badge-info" },
  viewer: { label: "Viewer", className: "badge-ghost" },
};

const CollabSidebar = ({
  socket,
  roomMongooseId,
  currentUserId,
  editorInstance,
  roomRole,
}: {
  socket: Socket | null;
  roomMongooseId: string | undefined;
  currentUserId: string | undefined;
  editorInstance: editor.IStandaloneCodeEditor | null;
  roomRole: string | undefined;
}) => {
  const [tab, setTab] = useState<Tab>("chat");
  const [showCallWidget, setShowCallWidget] = useState(false);

  return (
    <div className="w-72 h-full flex flex-col bg-[#0d1117] border-l border-gray-700/50 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        {(["chat", "call", "people"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`flex-1 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              tab === t
                ? "text-white border-b-2 border-[#58a6ff] bg-[#161b22]"
                : "text-gray-500 hover:text-gray-300 hover:bg-[#161b22]/50"
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "chat" && (
          <ChatTab socket={socket} roomMongooseId={roomMongooseId} />
        )}
        {tab === "call" && (
          <CallTab
            socket={socket}
            showWidget={showCallWidget}
            setShowWidget={setShowCallWidget}
          />
        )}
        {tab === "people" && (
          <PeopleTab
            socket={socket}
            currentUserId={currentUserId}
            roomRole={roomRole}
            roomId={roomMongooseId || ""}
          />
        )}
      </div>

      {/* Code Vitals — always visible at bottom */}
      <div className="border-t border-gray-700/30">
        <CodeVitals editorInstance={editorInstance} />
      </div>
    </div>
  );
};

const ChatTab = ({
  socket,
  roomMongooseId,
}: {
  socket: Socket | null;
  roomMongooseId: string | undefined;
}) => {
  const { userId } = useSelector((state: any) => state?.user);
  const [newMessage, setNewMessage] = useState("");
  const { messages, sendMessage, fetchRoomChats } = useChat(
    socket,
    roomMongooseId,
  );
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchRoomChats();
      },
      { root: chatBodyRef.current, threshold: 1 },
    );
    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [fetchRoomChats]);

  useEffect(() => {
    if (!chatBodyRef.current) return;
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        ref={chatBodyRef}
      >
        <div ref={topSentinelRef} className="h-0.5" />
        {messages?.map(({ _id, message, sender }: any) => {
          const isOwn = sender._id === userId;
          return (
            <div
              key={_id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-xs ${
                  isOwn
                    ? "bg-[#238636] text-white"
                    : "bg-[#21262d] text-gray-200"
                }`}
              >
                <p>{message}</p>
                <span className="text-[9px] opacity-50">{sender.name}</span>
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 p-2 border-t border-gray-700/30"
      >
        <input
          type="text"
          value={newMessage}
          placeholder="Message..."
          className="flex-1 px-2 py-1.5 text-xs rounded bg-[#161b22] text-gray-200 outline-none border border-gray-700/50 focus:border-[#58a6ff] placeholder-gray-500"
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-xs btn-circle bg-[#238636] border-none hover:bg-[#2ea043]"
        >
          <IoSend size={11} />
        </button>
      </form>
    </div>
  );
};

const CallTab = ({
  socket,
  showWidget,
  setShowWidget,
}: {
  socket: Socket | null;
  showWidget: boolean;
  setShowWidget: (v: boolean) => void;
}) => {
  const {
    inCall,
    cameraOn,
    micOn,
    screenShareOn,
    localStreams,
    remoteParticipants,
    joinCall,
    endCall,
    toggleCam,
    toggleMic,
    toggleScreen,
  } = useRoomCall(socket);

  if (!inCall) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
        <div className="text-2xl text-gray-500">📞</div>
        <p className="text-xs text-gray-400 text-center">
          Start or join a voice/video call
        </p>
        <button className="btn btn-sm bg-[#238636] border-none hover:bg-[#2ea043]" onClick={joinCall}>
          Join Call
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        <div className="relative w-full h-2/5 bg-[#161b22] rounded-lg overflow-hidden">
          {localStreams.camera && (
            <video
              ref={(el) => {
                if (el && localStreams.camera) {
                  el.srcObject = localStreams.camera;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          {!localStreams.camera && (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
              Camera off
            </div>
          )}
        </div>
        <div className="h-2/5 flex gap-2 overflow-x-auto">
          {localStreams.screen && (
            <VideoTile
              stream={localStreams.screen}
              isActive={false}
              onClick={() => {}}
            />
          )}
          {Object.values(remoteParticipants).flatMap((peer) =>
            [peer.camera, peer.screen]
              .filter(Boolean)
              .map((stream, i) => (
                <VideoTile
                  key={`${peer.peerId}-${i}`}
                  stream={stream!}
                  isActive={false}
                  onClick={() => {}}
                />
              )),
          )}
        </div>
        {Object.values(remoteParticipants).map(
          (peer) =>
            peer.mic && (
              <AudioRenderer
                key={`${peer.peerId}-audio`}
                stream={peer.mic}
              />
            ),
        )}
      </div>
      <div className="flex justify-center gap-2 p-2 border-t border-gray-700/30">
        <button
          onClick={toggleMic}
          className={`btn btn-xs btn-circle ${micOn ? "bg-[#238636]" : ""}`}
        >
          {micOn ? <IoMic size={12} /> : <IoMicOff size={12} />}
        </button>
        <button
          onClick={toggleCam}
          className={`btn btn-xs btn-circle ${cameraOn ? "bg-[#238636]" : ""}`}
        >
          {cameraOn ? <IoVideocam size={12} /> : <IoVideocamOff size={12} />}
        </button>
        <button
          onClick={toggleScreen}
          className={`btn btn-xs btn-circle ${screenShareOn ? "bg-[#238636]" : ""}`}
        >
          {screenShareOn ? (
            <MdOutlineScreenShare size={12} />
          ) : (
            <MdOutlineStopScreenShare size={12} />
          )}
        </button>
        <button
          className="btn btn-xs btn-circle bg-red-500 hover:bg-red-600"
          onClick={() => {
            endCall();
            setShowWidget(false);
          }}
        >
          <span className="text-[10px]">✕</span>
        </button>
      </div>
    </div>
  );
};

const PeopleTab = ({
  socket,
  currentUserId,
  roomRole,
  roomId,
}: {
  socket: Socket | null;
  currentUserId: string | undefined;
  roomRole: string | undefined;
  roomId: string;
}) => {
  const collaborators = useActiveCollaborators(socket, currentUserId, roomId);

  return (
    <div className="p-3 space-y-3">
      <div>
        <h4 className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">
          Active — {collaborators.length}
        </h4>
        {collaborators.length === 0 ? (
          <p className="text-xs text-gray-500">No other collaborators</p>
        ) : (
          <div className="space-y-1.5">
            {collaborators.map((c, i) => (
              <div
                key={c.userId}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#161b22]"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{
                    backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-200 truncate">
                    {c.name}
                    {c.userId === currentUserId && (
                      <span className="text-[9px] text-gray-500 ml-1">
                        (you)
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`badge badge-xs ${
                    ROLE_BADGES[c.role]?.className || "badge-ghost"
                  }`}
                >
                  {ROLE_BADGES[c.role]?.label || c.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollabSidebar;
