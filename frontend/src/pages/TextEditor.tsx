import { useEffect, useRef, useState } from "react";

import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { getSocket, createSocket } from "../utils/socket";
import { LangTypes } from "../commons/vars/lang-types";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useOnline } from "../hooks/useOnline";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";
import { authRequest } from "../utils/axios.interceptor";

const TextEditor = () => {
  const [code, setCode] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [language, setLanguage] = useState<string>("javascript");

  const { roomId } = useParams();
  const {
    user: { token },
  } = useSelector((state: any) => state.user);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const isRemoteUpdate = useRef(false);

  const isOnline = useOnline();

  useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal({
        convertEol: true,
        fontSize: 14,
        theme: { background: "#1e1e1e" },
      });

      const fitAddOn = new FitAddon();
      term.loadAddon(fitAddOn);
      term.open(terminalRef.current);
      fitAddOn.fit();

      term.write("Welcome to Code Arena X Terminal\n");
      terminalInstance.current = term;
      window.addEventListener("resize", () => fitAddOn?.fit());

      return () => {
        term.dispose();
        window.removeEventListener("resize", () => {});
      };
    }
  }, [terminalRef]);

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

    socket?.on("run-code:output", (data: any) => {
      terminalInstance.current?.writeln(data);
    });

    return () => {
      socket?.off("room:init");
      socket?.off("room:update");
      socket?.off("run-code:output");
      socket?.emit("room:leave", roomId);
      // socket?.disconnect();
    };
  }, [roomId, socket, isOnline, socket?.active]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === "Enter" || e.key == "'")) {
        e.preventDefault();
        handleCodeRun();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  const handleCodeValidation = (markers: monaco.editor.IMarker[]) => {
    markers.forEach((marker: monaco.editor.IMarker) => {
      console.log(marker.message);
    });
  };

  const handleCodeRun = async () => {
    try {
      await authRequest.post("/run-code", {
        roomId,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col gap-2">
      <div className="flex justify-between h-fit">
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
        <button className="btn btn-ghost" onClick={handleCodeRun}>
          Run
        </button>
      </div>
      <Editor
        className="flex-1"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        onValidate={handleCodeValidation}
      />
      <div className="h-2/12 p-1">
        <div ref={terminalRef} style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>
  );
};

export default TextEditor;
