import { useState, useEffect, useRef, useCallback } from "react";
import { authRequest } from "../utils/axios.interceptor";

interface EditEntry {
  text: string;
  timestamp: string;
  userId: string;
}

interface ReplayData {
  lang: string;
  content: string;
  edits: EditEntry[];
  sessions: { initialState: number[] | null; createdAt: string }[];
}

export const useCodeReplay = (roomId: string) => {
  const [texts, setTexts] = useState<string[]>([]);
  const [lang, setLang] = useState("javascript");
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

  useEffect(() => {
    setLoading(true);
    authRequest
      .get(`rooms/${roomId}/replay`)
      .then((res) => {
        const data: ReplayData = res.data;
        const allEdits = data.edits;

        const allTexts: string[] = [];
        let lastText = data.content || "";
        for (const edit of allEdits) {
          if (edit.text != null && edit.text !== "") {
            lastText = edit.text;
          }
          allTexts.push(lastText);
        }

        textsRef.current = allTexts;
        setTexts(allTexts);
        setLang(data.lang);
        idxRef.current = 0;
        setCurrentIndex(0);
        setIsFinished(false);

        onUpdateRef.current?.(data.content || "");

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [roomId]);

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
    isPlaying,
    isFinished,
    currentIndex,
    total: texts.length,
    loading,
    speed,
    play,
    pause,
    reset,
    setSpeed: setPlaySpeed,
    onUpdateRef,
  };
};
