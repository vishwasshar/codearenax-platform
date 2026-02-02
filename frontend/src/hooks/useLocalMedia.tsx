import { useEffect, useRef, useState } from "react";

const useLocalMedia = () => {
  const [zoomedTrackId, setZoomedTrackId] = useState<string>();
  const [cameraOn, setCameraOn] = useState<Boolean>(false);
  const [micOn, setMicOn] = useState<Boolean>(false);
  const [screenShareOn, setScreenShareOn] = useState<Boolean>(false);

  const trackMapRef = useRef<Map<string, MediaStreamTrack>>(new Map());

  const zoomedStreamRef = useRef<HTMLVideoElement>(null);

  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  const handleCameraOn = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const cameraTrack = stream.getVideoTracks()[0];
    const micTrack = stream.getAudioTracks()[0];

    cameraTrackRef.current = cameraTrack;
    micTrackRef.current = micTrack;

    trackMapRef.current.set(cameraTrack.id, cameraTrack);

    setZoomedTrackId(cameraTrack.id);

    setCameraOn(true);
    setMicOn(true);
  };

  const handleCameraOff = async () => {
    if (cameraTrackRef.current)
      trackMapRef.current.delete(cameraTrackRef.current.id);

    if (screenTrackRef.current)
      trackMapRef.current.delete(screenTrackRef.current.id);

    cameraTrackRef.current?.stop();
    cameraTrackRef.current = null;

    micTrackRef.current?.stop();
    micTrackRef.current = null;

    screenTrackRef.current?.stop();
    screenTrackRef.current = null;

    setZoomedTrackId(undefined);

    setCameraOn(false);
    setMicOn(false);
    setScreenShareOn(false);
  };

  const handleCameraToggle = () => {
    if (!cameraTrackRef.current) {
      handleCameraOn();
      return;
    }

    cameraTrackRef.current.enabled = !cameraTrackRef.current.enabled;

    setCameraOn(cameraTrackRef.current.enabled);
  };

  const handleMicToggle = () => {
    if (!micTrackRef.current) {
      handleCameraOn();
      return;
    }

    micTrackRef.current.enabled = !micTrackRef.current.enabled;

    setMicOn(micTrackRef.current.enabled);
  };

  const handleScreenShare = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const screenTrack = screenStream.getVideoTracks()[0];

    screenTrackRef.current = screenTrack;
    trackMapRef.current.set(screenTrack.id, screenTrack);

    setScreenShareOn(true);
    setZoomedTrackId(screenTrack.id);

    screenTrack.onended = () => handleCameraOn();
  };

  const handleScreenShareStop = () => {
    if (!screenTrackRef.current || !cameraTrackRef.current) return;

    trackMapRef.current.delete(screenTrackRef.current.id);
    screenTrackRef.current.stop();
    screenTrackRef.current = null;

    setZoomedTrackId(cameraTrackRef.current.id);
    setScreenShareOn(false);
  };

  useEffect(() => {
    if (!zoomedTrackId || !zoomedStreamRef.current) return;

    const track = trackMapRef.current.get(zoomedTrackId);
    if (!track) return;

    zoomedStreamRef.current.srcObject = new MediaStream([track]);
  }, [zoomedTrackId]);

  return {
    trackMapRef,
    zoomedStreamRef,
    handleCameraOn,
    handleCameraOff,
    setZoomedTrackId,
    cameraOn,
    micOn,
    screenShareOn,
    handleCameraToggle,
    handleMicToggle,
    handleScreenShare,
    handleScreenShareStop,
  };
};

export default useLocalMedia;
