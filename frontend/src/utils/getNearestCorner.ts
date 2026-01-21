import type { Corner, Rect } from "../commons/vars/corner-types";

export const getNearestCorner = (x: number, y: number, rect: Rect): Corner => {
  const midX = rect.width / 2;
  const midY = rect.height / 2;

  if (x < midX && y < midY) return "top-left";
  if (x >= midX && y < midY) return "top-right";
  if (x < midX && y >= midY) return "bottom-left";
  return "bottom-right";
};
