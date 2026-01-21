import { useDraggable } from "@dnd-kit/core";
import React from "react";
import type { Corner } from "../commons/vars/corner-types";

const SNAP_OFFSET = 16;

const cornerStyles: Record<Corner, React.CSSProperties> = {
  "top-left": { top: SNAP_OFFSET, left: SNAP_OFFSET },
  "top-right": { top: SNAP_OFFSET, right: SNAP_OFFSET },
  "bottom-left": { bottom: SNAP_OFFSET, left: SNAP_OFFSET },
  "bottom-right": { bottom: SNAP_OFFSET, right: SNAP_OFFSET },
};

const FloatingWidget: React.FC<{ corner: Corner }> = ({ corner }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "chat-panel",
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
      <div className="chat-body">Body</div>
      <div></div>
    </div>
  );
};

export default FloatingWidget;
