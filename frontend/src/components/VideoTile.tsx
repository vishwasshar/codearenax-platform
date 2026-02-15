import { useEffect, useRef } from "react";

const VideoTile: React.FC<{
  stream: MediaStream;
  isActive: boolean;
  onClick: () => void;
}> = ({ stream, isActive, onClick }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.srcObject = stream;

    ref.current.onloadedmetadata = () => {
      ref.current?.play().catch(() => {});
    };

    return () => {
      if (ref.current) {
        ref.current.pause();
        ref.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      onClick={onClick}
      className={`border h-28 cursor-pointer transition-all `}
    />
  );
};

export default VideoTile;
