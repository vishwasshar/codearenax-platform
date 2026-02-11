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
import { useSelector } from "react-redux";
import useLocalMedia from "../hooks/useLocalMedia";

type Size = {
  width: number;
  height: number;
};

const CallWidget: React.FC<{
  socket: Socket;
  showWidget: Boolean;
  setShowWidget: any;
  roomId: string | undefined;
}> = ({ socket, roomId, showWidget, setShowWidget }) => {
  const { userId } = useSelector((state: any) => state?.user);

  const [size, setSize] = useState<Size>({
    width: 400,
    height: 300,
  });

  const {
    trackMapRef,
    zoomedStreamRef,
    handleCameraOn,
    handleCameraOff,
    setZoomedTrackId,
    handleCameraToggle,
    handleMicToggle,
    handleScreenShare,
    handleScreenShareStop,
    cameraOn,
    micOn,
    screenShareOn,
  } = useLocalMedia();

  useEffect(() => {
    if (showWidget) handleCameraOn();

    return () => {
      handleCameraOff();
    };
  }, [showWidget]);

  return (
    <>
      <button
        className={`btn btn-lg btn-circle bg-slate-700 border-none shadow-2xl shadow-gray-700 widgetToggle ${showWidget ? "hide" : "show"}`}
        onClick={(e) => {
          e.preventDefault();
          setShowWidget((curr: Boolean) => !curr);
        }}
      >
        <BsPhone size={25} color="#fff" />
      </button>

      <div className={`call-panel ${showWidget ? "show" : "hide"}`}>
        <div className="call-header">
          <h2>Room Call</h2>
          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={() => {
              setShowWidget((curr: Boolean) => !curr);
              handleCameraOff();
            }}
          >
            <IoClose size={16} />
          </button>
        </div>
        <Resizable
          size={size}
          minWidth={200}
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
          onResizeStop={(_, __, dom, delta) => {
            const maxWidth =
              (dom.parentElement?.parentElement?.clientWidth || 0) * 0.5;
            const maxHeight =
              (dom.parentElement?.parentElement?.clientHeight || 0) * 0.7;

            setSize((sz) => {
              const newWidth = sz.width + delta.width;
              const newHeight = sz.height + delta.height;

              return {
                height: newHeight > maxHeight ? maxHeight : newHeight,
                width: newWidth > maxWidth ? maxWidth : newWidth,
              };
            });
          }}
        >
          <div className="h-full flex flex-col bg-black">
            <div
              className="flex flex-col overflow-y-scroll scroll-smooth gap-4 p-4"
              style={{ flex: 1 }}
            >
              <div className="relative w-full h-3/5 border border-base-100">
                <video
                  ref={zoomedStreamRef}
                  autoPlay={true}
                  muted={true}
                  controls={false}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="h-2/5 flex gap-4 overflow-x-auto w-full">
                {[...trackMapRef.current.values()].map((track) => (
                  <video
                    key={track.id}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: 120, cursor: "pointer" }}
                    onClick={() => setZoomedTrackId(track.id)}
                    ref={(el) => {
                      if (el) el.srcObject = new MediaStream([track]);
                    }}
                    className="border border-base-100 h-10/12"
                  />
                ))}
              </div>
            </div>
            <form className="message-form w-full flex justify-center items-center gap-2 py-2 px-4">
              <button
                onClick={handleCameraToggle}
                className={`btn btn-circle  ${cameraOn ? "bg-green-400" : ""}`}
                type="button"
              >
                {cameraOn ? (
                  <IoVideocam size={15} />
                ) : (
                  <IoVideocamOff size={15} />
                )}
              </button>

              <button
                onClick={handleMicToggle}
                className={`btn btn-circle  ${micOn ? "bg-green-400" : ""}`}
                type="button"
              >
                {micOn ? <IoMic size={15} /> : <IoMicOff size={15} />}
              </button>
              <button
                onClick={
                  screenShareOn ? handleScreenShareStop : handleScreenShare
                }
                className={`btn btn-circle  ${screenShareOn ? "bg-green-400" : ""}`}
                type="button"
              >
                {screenShareOn ? (
                  <MdOutlineScreenShare size={15} />
                ) : (
                  <MdOutlineStopScreenShare size={15} />
                )}
              </button>
              <button
                className="btn btn-circle"
                type="button"
                onClick={() => {
                  setShowWidget((curr: Boolean) => !curr);
                  handleCameraOff();
                }}
              >
                <IoClose size={15} />
              </button>
            </form>
          </div>
        </Resizable>
      </div>
    </>
  );
};

export default CallWidget;
