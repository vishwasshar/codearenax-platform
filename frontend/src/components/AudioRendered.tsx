import React, { useEffect, useRef } from "react";

const AudioRenderer: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.srcObject = stream;

    ref.current.onloadedmetadata = () => {
      ref.current?.play().catch(console.error);
    };
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
};

export default AudioRenderer;
