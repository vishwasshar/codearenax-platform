import React, { useEffect, useState } from "react";
import { Resizable } from "re-resizable";
import { BsPhone } from "react-icons/bs";
import {
  IoClose,
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
} from "react-icons/io5";
import { MdOutlineScreenShare, MdOutlineStopScreenShare } from "react-icons/md";
import type { Socket } from "socket.io-client";
import useRoomCall from "../hooks/useRoomCall";
import VideoTile from "./VideoTile";
import AudioRenderer from "./AudioRendered";

type Size = {
  width: number;
  height: number;
};

const CallWidget: React.FC<{
  socket: Socket;
  showWidget: boolean;
  setShowWidget: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ socket, showWidget, setShowWidget }) => {
  const [size, setSize] = useState<Size>({
    width: 420,
    height: 480,
  });

  const {
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
  } = useRoomCall(socket);

  useEffect(() => {
    if (zoomedTrackId) return;

    if (localStreams.screen) {
      setZoomedTrackId("local-screen");
    } else if (localStreams.camera) {
      setZoomedTrackId("local-camera");
    }
  }, [localStreams, zoomedTrackId, setZoomedTrackId]);

  return (
    <>
      {!showWidget && (
        <button
          className="btn btn-lg btn-circle bg-slate-700 border-none shadow-xl bottom-6 widgetToggle right-6 z-50"
          onClick={() => setShowWidget(true)}
        >
          <BsPhone size={22} color="#fff" />
        </button>
      )}

      {showWidget && (
        <div className="call-panel">
          <Resizable
            size={size}
            minWidth={300}
            minHeight={400}
            enable={{
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true,
            }}
            onResizeStop={(_, __, ___, delta) => {
              setSize((prev) => ({
                width: prev.width + delta.width,
                height: prev.height + delta.height,
              }));
            }}
            className="bg-black rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center p-3 bg-gray-900 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-white">Room Call</h2>
              <button
                className="btn btn-xs btn-circle btn-ghost"
                onClick={() => setShowWidget(false)}
              >
                <IoClose size={14} />
              </button>
            </div>

            {!inCall ? (
              <div className="flex flex-1 items-center justify-center">
                <button className="btn bg-success/80" onClick={joinCall}>
                  Join Call
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
                  <div className="relative w-full h-3/5 bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={zoomedStreamRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="h-2/5 flex gap-3 overflow-x-auto">
                    {localStreams.camera && (
                      <VideoTile
                        stream={localStreams.camera}
                        isActive={zoomedTrackId === "local-camera"}
                        onClick={() => setZoomedTrackId("local-camera")}
                      />
                    )}

                    {localStreams.screen && (
                      <VideoTile
                        stream={localStreams.screen}
                        isActive={zoomedTrackId === "local-screen"}
                        onClick={() => setZoomedTrackId("local-screen")}
                      />
                    )}

                    {Object.values(remoteParticipants).map((peer) => (
                      <React.Fragment key={peer.peerId}>
                        {peer.camera && (
                          <VideoTile
                            stream={peer.camera}
                            isActive={zoomedTrackId === `${peer.peerId}-camera`}
                            onClick={() =>
                              setZoomedTrackId(`${peer.peerId}-camera`)
                            }
                          />
                        )}

                        {peer.screen && (
                          <VideoTile
                            stream={peer.screen}
                            isActive={zoomedTrackId === `${peer.peerId}-screen`}
                            onClick={() =>
                              setZoomedTrackId(`${peer.peerId}-screen`)
                            }
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
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

                <div className="flex justify-center gap-4 p-3 bg-gray-900 border-t border-gray-700">
                  <button
                    onClick={toggleCam}
                    className={`btn btn-circle ${
                      cameraOn ? "bg-green-500" : ""
                    }`}
                  >
                    {cameraOn ? (
                      <IoVideocam size={18} />
                    ) : (
                      <IoVideocamOff size={18} />
                    )}
                  </button>

                  <button
                    onClick={toggleMic}
                    className={`btn btn-circle ${micOn ? "bg-green-500" : ""}`}
                  >
                    {micOn ? <IoMic size={18} /> : <IoMicOff size={18} />}
                  </button>

                  <button
                    onClick={toggleScreen}
                    className={`btn btn-circle ${
                      screenShareOn ? "bg-green-500" : ""
                    }`}
                  >
                    {screenShareOn ? (
                      <MdOutlineScreenShare size={18} />
                    ) : (
                      <MdOutlineStopScreenShare size={18} />
                    )}
                  </button>

                  <button
                    className="btn btn-circle bg-red-500"
                    onClick={() => {
                      endCall();
                      setShowWidget(false);
                    }}
                  >
                    <IoClose size={18} />
                  </button>
                </div>
              </>
            )}
          </Resizable>
        </div>
      )}
    </>
  );
};

export default CallWidget;
