import { useEffect, useState } from "react";
import type { editor } from "monaco-editor";
import type { Socket } from "socket.io-client";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useActiveCollaborators } from "../hooks/useActiveCollaborators";

const StatusBar = ({
  editorInstance,
  language,
  socket,
  roomRole,
  currentUserId,
  roomId,
}: {
  editorInstance: editor.IStandaloneCodeEditor | null;
  language: string;
  socket: Socket | null;
  roomRole: string | undefined;
  currentUserId: string | undefined;
  roomId: string;
}) => {
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const connectionState = useSocketConnection(socket);
  const collaborators = useActiveCollaborators(socket, currentUserId, roomId);

  useEffect(() => {
    if (!editorInstance) return;
    const pos = editorInstance.getPosition();
    if (pos) setCursor({ line: pos.lineNumber, col: pos.column });

    const disposable = editorInstance.onDidChangeCursorPosition((e) => {
      setCursor({ line: e.position.lineNumber, col: e.position.column });
    });
    return () => disposable.dispose();
  }, [editorInstance]);

  const stateColors: Record<string, string> = {
    connected: "bg-success",
    connecting: "bg-info",
    reconnecting: "bg-warning",
    disconnected: "bg-error",
  };

  return (
    <div className="flex items-center justify-between px-4 py-1 text-xs text-gray-400 bg-[#1a1a2e] border-t border-gray-700/50 select-none">
      <div className="flex items-center gap-4">
        <span>Ln {cursor.line}, Col {cursor.col}</span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">{language}</span>
      </div>
      <div className="flex items-center gap-4">
        {roomRole && (
          <span className={`badge badge-sm ${roomRole === "owner" ? "badge-warning" : roomRole === "editor" ? "badge-info" : "badge-ghost"}`}>
            {roomRole}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${stateColors[connectionState] || "bg-gray-500"}`} />
          <span>{connectionState}</span>
        </div>
        <span>{collaborators.length} collaborator{collaborators.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
};

export default StatusBar;
