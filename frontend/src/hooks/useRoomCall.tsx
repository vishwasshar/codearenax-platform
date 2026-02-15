import { useEffect, useRef, useState } from "react";
import { Device, type types as mediasoupTypes } from "mediasoup-client";
import type { Socket } from "socket.io-client";

type SourceType = "camera" | "mic" | "screen";

type RemoteParticipant = {
  peerId: string;
  camera?: MediaStream;
  mic?: MediaStream;
  screen?: MediaStream;
};

const useRoomCall = (socket: Socket) => {
  const [inCall, setInCall] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [zoomedTrackId, setZoomedTrackId] = useState<string | null>(null);

  const [localStreams, setLocalStreams] = useState<{
    camera: MediaStream | null;
    mic: MediaStream | null;
    screen: MediaStream | null;
  }>({ camera: null, mic: null, screen: null });

  const [remoteParticipants, setRemoteParticipants] = useState<
    Record<string, RemoteParticipant>
  >({});

  const zoomedStreamRef = useRef<HTMLVideoElement>(null);

  const deviceRef = useRef<mediasoupTypes.Device | null>(null);
  const sendTransportRef = useRef<mediasoupTypes.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupTypes.Transport | null>(null);

  const producersRef = useRef<
    Record<SourceType, mediasoupTypes.Producer | null>
  >({
    camera: null,
    mic: null,
    screen: null,
  });

  const consumersRef = useRef<
    Map<
      string,
      {
        consumer: mediasoupTypes.Consumer;
        peerId: string;
        source: SourceType;
      }
    >
  >(new Map());

  /* ---------------- LOCAL MEDIA ---------------- */

  const stopSource = (source: SourceType) => {
    producersRef.current[source]?.close();
    producersRef.current[source] = null;

    setLocalStreams((prev) => {
      const next = { ...prev };
      next[source]?.getTracks().forEach((t) => t.stop());
      next[source] = null;
      return next;
    });

    if (source === "camera") setCameraOn(false);
    if (source === "mic") setMicOn(false);
    if (source === "screen") setScreenShareOn(false);
  };

  const startSource = async (source: SourceType) => {
    if (!sendTransportRef.current) return;

    try {
      const media =
        source === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({ video: true })
          : await navigator.mediaDevices.getUserMedia({
              video: source === "camera",
              audio: source === "mic",
            });

      const track =
        source === "mic"
          ? media.getAudioTracks()[0]
          : media.getVideoTracks()[0];

      const producer = await sendTransportRef.current.produce({
        track,
        appData: { source },
      });

      producersRef.current[source] = producer;

      setLocalStreams((prev) => ({
        ...prev,
        [source]: new MediaStream([track]),
      }));

      if (source === "camera") setCameraOn(true);
      if (source === "mic") setMicOn(true);
      if (source === "screen") {
        setScreenShareOn(true);
        track.onended = () => stopSource("screen");
      }
    } catch (err) {
      console.error("startSource error:", err);
    }
  };

  const toggleCam = () =>
    producersRef.current.camera ? stopSource("camera") : startSource("camera");

  const toggleMic = () =>
    producersRef.current.mic ? stopSource("mic") : startSource("mic");

  const toggleScreen = () =>
    producersRef.current.screen ? stopSource("screen") : startSource("screen");

  /* ---------------- CONSUMERS ---------------- */

  const handleNewProducer = async ({
    producerId,
    peerId,
    appData,
  }: {
    producerId: string;
    peerId: string;
    appData: { source: SourceType };
  }) => {
    if (!deviceRef.current || !recvTransportRef.current) return;

    try {
      const consumerData = await socket.emitWithAck("mediasoup:consume", {
        transportId: recvTransportRef.current.id,
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      });

      const consumer = await recvTransportRef.current.consume({
        ...consumerData,
        appData: consumerData.appData,
      });

      consumer.track.onended = () => {
        handleProducerClosed(producerId);
      };

      const stream = new MediaStream([consumer.track]);

      const source = consumerData.appData.source as SourceType;

      consumersRef.current.set(producerId, {
        consumer,
        peerId,
        source,
      });

      setRemoteParticipants((prev) => ({
        ...prev,
        [peerId]: {
          ...prev[peerId],
          peerId,
          [source]: stream,
        },
      }));

      await socket.emitWithAck("mediasoup:resume-consumer", consumer.id);

      setTimeout(async () => {
        const stats = await consumer.getStats();
        console.log("Consumer stats:", stats);
      }, 2000);
    } catch (err) {
      console.error("handleNewProducer error:", err);
    }
  };

  const handleProducerClosed = (producerId: string) => {
    const item = consumersRef.current.get(producerId);
    if (!item) return;

    const { consumer, peerId, source } = item;

    consumer.close();
    consumersRef.current.delete(producerId);

    setRemoteParticipants((prev) => {
      const peer = prev[peerId];
      if (!peer) return prev;

      const updatedPeer = { ...peer };
      delete updatedPeer[source];

      const hasMedia =
        updatedPeer.camera || updatedPeer.mic || updatedPeer.screen;

      if (!hasMedia) {
        const newState = { ...prev };
        delete newState[peerId];
        return newState;
      }

      return { ...prev, [peerId]: updatedPeer };
    });

    if (zoomedTrackId === `${peerId}-${source}`) {
      setZoomedTrackId(null);

      if (zoomedStreamRef.current) {
        zoomedStreamRef.current.pause();
        zoomedStreamRef.current.srcObject = null;
      }
    }
  };

  /* ---------------- JOIN ---------------- */

  const joinCall = async () => {
    const device = new Device();
    deviceRef.current = device;

    const routerRtpCapabilities = await socket.emitWithAck(
      "mediasoup:get-router-rtp-capabilities",
    );

    await device.load({ routerRtpCapabilities });

    const [sendData, recvData] = await Promise.all([
      socket.emitWithAck("mediasoup:create-webrtc-transport"),
      socket.emitWithAck("mediasoup:create-webrtc-transport"),
    ]);

    const sendTransport = device.createSendTransport(sendData);
    const recvTransport = device.createRecvTransport(recvData);

    sendTransportRef.current = sendTransport;
    recvTransportRef.current = recvTransport;

    sendTransport.on("connect", async ({ dtlsParameters }, cb, eb) => {
      try {
        await socket.emitWithAck("mediasoup:connect-transport", {
          transportId: sendTransport.id,
          dtlsParameters,
        });
        cb();
      } catch (err) {
        eb(err as Error);
      }
    });

    sendTransport.on("produce", async (params, cb, eb) => {
      try {
        const { id } = await socket.emitWithAck("mediasoup:produce", {
          transportId: sendTransport.id,
          ...params,
        });
        cb({ id });
      } catch (err) {
        eb(err as Error);
      }
    });

    recvTransport.on("connect", async ({ dtlsParameters }, cb, eb) => {
      try {
        await socket.emitWithAck("mediasoup:connect-transport", {
          transportId: recvTransport.id,
          dtlsParameters,
        });
        cb();
      } catch (err) {
        eb(err as Error);
      }
    });

    recvTransport.on("connectionstatechange", (state) => {
      console.log(state);
    });

    socket.on("newProducer", handleNewProducer);
    socket.on("producerClosed", handleProducerClosed);

    /* -------- LATE JOIN SUPPORT -------- */

    const existingProducers = await socket.emitWithAck(
      "mediasoup:get-existing-producers",
    );

    for (const producer of existingProducers) {
      await handleNewProducer(producer);
    }

    setInCall(true);
  };

  const endCall = () => {
    ["camera", "mic", "screen"].forEach((s) => stopSource(s as SourceType));

    consumersRef.current.forEach(({ consumer }) => consumer.close());
    consumersRef.current.clear();

    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    socket.off("newProducer", handleNewProducer);
    socket.off("producerClosed", handleProducerClosed);

    setRemoteParticipants({});
    setInCall(false);
  };

  useEffect(() => {
    if (!zoomedStreamRef.current || !zoomedTrackId) return;

    const [peerId, source] = zoomedTrackId.split("-");

    let stream: MediaStream | null = null;

    if (peerId === "local") {
      stream = localStreams[source as SourceType] || null;
    } else {
      stream = remoteParticipants[peerId]?.[source as SourceType] || null;
    }

    if (stream) {
      const video = zoomedStreamRef.current;

      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play().catch((e) => console.warn("Play blocked:", e));
      };
    }
  }, [zoomedTrackId, localStreams, remoteParticipants]);

  useEffect(() => {
    if (zoomedTrackId) return;

    const firstRemote = Object.values(remoteParticipants)[0];

    if (firstRemote?.screen) {
      setZoomedTrackId(`${firstRemote.peerId}-screen`);
    } else if (firstRemote?.camera) {
      setZoomedTrackId(`${firstRemote.peerId}-camera`);
    }
  }, [remoteParticipants, zoomedTrackId]);

  return {
    inCall,
    cameraOn,
    micOn,
    screenShareOn,
    localStreams,
    remoteParticipants,
    zoomedStreamRef,
    joinCall,
    endCall,
    toggleCam,
    toggleMic,
    toggleScreen,
    zoomedTrackId,
    setZoomedTrackId,
  };
};

export default useRoomCall;
