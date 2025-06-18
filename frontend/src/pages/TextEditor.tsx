import { useEffect, useRef, useState } from "react";

import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { getSocket, createSocket } from "../utils/socket";
import { LangTypes } from "../commons/vars/lang-types";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useOnline } from "../hooks/useOnline";
import { Socket } from "socket.io-client";

const TextEditor = () => {
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("javascript");
  const { roomId } = useParams();
  const {
    user: { token },
  } = useSelector((state: any) => state.user);
  const isOnline = useOnline();
  const [socket, setSocket] = useState<Socket | null>(null);

  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    setSocket(getSocket());
  }, [getSocket()]);

  useEffect(() => {
    if (socket?.active && !isRemoteUpdate.current) {
      const delayDebounce = setTimeout(() => {
        try {
          socket?.emit("room:edit", {
            content: code,
            lang: language,
            roomId,
          });
        } catch (err) {
          console.log(err);
        }
      }, 250);

      return () => clearTimeout(delayDebounce);
    }

    isRemoteUpdate.current = false;
  }, [code, language]);

  useEffect(() => {
    if (token) {
      createSocket(token);
    }
  }, [token]);

  useEffect(() => {
    if (!socket?.active) return;

    socket?.emit("room:join", roomId);

    socket?.on("room:init", (data: any) => {
      isRemoteUpdate.current = true;
      setCode(data.content);
      setLanguage(data.lang);
    });

    socket?.on("room:update", (data: any) => {
      isRemoteUpdate.current = true;
      setCode(data.content);
      setLanguage(data.lang);
    });

    return () => {
      socket?.off("room:init");
      socket?.off("room:update");
      socket?.emit("room:leave", roomId);
      // socket?.disconnect();
    };
  }, [roomId, socket, isOnline, socket?.active]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  const handleCodeValidation = (markers: monaco.editor.IMarker[]) => {
    markers.forEach((marker: monaco.editor.IMarker) => {
      console.log(marker.message);
    });
  };

  return (
    <div className="w-full h-screen flex flex-col gap-2">
      <div className="flex justify-end ">
        <select
          onChange={(e) => {
            setLanguage(e.target.value);
          }}
          value={language}
          className="select select-ghost w-50"
        >
          {LangTypes.map((lang) => (
            <option value={lang} key={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        onValidate={handleCodeValidation}
      />
    </div>
  );
};

export default TextEditor;
