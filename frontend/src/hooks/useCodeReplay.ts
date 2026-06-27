import { useState, useEffect, useRef, useCallback } from "react";
import { authRequest } from "../utils/axios.interceptor";

interface EditEntry {
  text: string;
  timestamp: string;
  userId: string;
  filePath: string;
}

interface FileEntry {
  path: string;
  content: string;
  lang: string;
}

interface ReplayData {
  files: FileEntry[];
  editedFiles: string[];
  edits: EditEntry[];
  sessions: { initialState: number[] | null; createdAt: string }[];
}

export const useCodeReplay = (roomId: string) => {
  const [texts, setTexts] = useState<string[]>([]);
  const [lang, setLang] = useState("javascript");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [editedFiles, setEditedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("index.js");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idxRef = useRef(0);
  const isPlayingRef = useRef(false);
  const textsRef = useRef<string[]>([]);
  const speedRef = useRef(5);
  const onUpdateRef = useRef<((text: string) => void) | null>(null);

  const fetchReplay = useCallback(async (filePath: string) => {
    setLoading(true);
    try {
      const res = await authRequest.get(`rooms/${roomId}/replay`, {
        params: { filePath },
      });
      const data: ReplayData = res.data;

      setFiles(data.files);
      setEditedFiles(data.editedFiles);

      const fileInfo = data.files.find((f) => f.path === filePath);
      const allEdits = data.edits;

      const allTexts: string[] = [];
      let lastText = fileInfo?.content || "";
      for (const edit of allEdits) {
        if (edit.text != null && edit.text !== "") {
          lastText = edit.text;
        }
        allTexts.push(lastText);
      }

      textsRef.current = allTexts;
      setTexts(allTexts);
      setLang(fileInfo?.lang || "javascript");
      idxRef.current = 0;
      setCurrentIndex(0);
      setIsFinished(false);

      onUpdateRef.current?.(fileInfo?.content || "");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchReplay(selectedFile);
  }, [selectedFile, fetchReplay]);

  const applyNext = useCallback(() => {
    try {
      const i = idxRef.current;
      const allTexts = textsRef.current;
      if (i >= allTexts.length) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setIsFinished(true);
        return;
      }

      const text = allTexts[i];
      onUpdateRef.current?.(text);

      idxRef.current = i + 1;
      setCurrentIndex(i + 1);

      if (isPlayingRef.current) {
        const interval = Math.max(20, 200 / speedRef.current);
        timerRef.current = setTimeout(applyNext, interval);
      }
    } catch (err) {
      console.error("[Replay] applyNext error:", err);
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const play = useCallback(() => {
    if (isFinished) {
      idxRef.current = 0;
      setCurrentIndex(0);
      setIsFinished(false);
      onUpdateRef.current?.(textsRef.current[0] || "");
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const interval = Math.max(20, 200 / speedRef.current);
    timerRef.current = setTimeout(applyNext, interval);
  }, [applyNext, isFinished]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    idxRef.current = 0;
    setCurrentIndex(0);
    setIsFinished(false);
    onUpdateRef.current?.(textsRef.current[0] || "");
  }, [pause]);

  const setPlaySpeed = useCallback(
    (s: number) => {
      speedRef.current = s;
      setSpeed(s);
      if (isPlayingRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        const interval = Math.max(5, 50 / s);
        timerRef.current = setTimeout(applyNext, interval);
      }
    },
    [applyNext],
  );

  return {
    texts,
    lang,
    files,
    editedFiles,
    selectedFile,
    setSelectedFile,
    isPlaying,
    isFinished,
    currentIndex,
    total: texts.length,
    loading,
    speed,
    play,
    pause,
    reset: hookReset,
    setSpeed: setPlaySpeed,
    onUpdateRef,
  };
};
