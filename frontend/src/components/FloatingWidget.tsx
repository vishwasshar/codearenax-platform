import { useDraggable } from "@dnd-kit/core";
import React, { useState } from "react";
import type { Corner } from "../commons/vars/corner-types";
import { Resizable } from "re-resizable";

const SNAP_OFFSET = 16;

const cornerStyles: Record<Corner, React.CSSProperties> = {
  "top-left": { top: SNAP_OFFSET, left: SNAP_OFFSET },
  "top-right": { top: SNAP_OFFSET, right: SNAP_OFFSET },
  "bottom-left": { bottom: SNAP_OFFSET, left: SNAP_OFFSET },
  "bottom-right": { bottom: SNAP_OFFSET, right: SNAP_OFFSET },
};

type Size = {
  width: number;
  height: number;
};

const FloatingWidget: React.FC<{ corner: Corner }> = ({ corner }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "chat-panel",
  });

  const [size, setSize] = useState<Size>({
    width: 400,
    height: 300,
  });

  return (
    <div
      className="chat-panel"
      style={{
        ...cornerStyles[corner],
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      ref={setNodeRef}
      {...attributes}
    >
      <div className="chat-header" {...listeners}>
        Header
      </div>
      <Resizable
        size={size}
        minHeight={400}
        minWidth={200}
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
          setSize((sz) => ({
            height: sz.height + delta.height,
            width: sz.width + delta.width,
          }));
        }}
      >
        <div className="chat-body">Body</div>
      </Resizable>
    </div>
  );
};

export default FloatingWidget;
