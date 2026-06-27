import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export type Collaborator = {
  userId: string;
  name: string;
  role: string;
};

export const useActiveCollaborators = (
  socket: Socket | null,
  currentUserId: string | undefined,
  roomId?: string,
) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleCurrentUsers = (users: Collaborator[]) => {
      setCollaborators(
        users.filter((u) => u.userId !== currentUserId),
      );
    };

    const handleUserJoined = (user: Collaborator) => {
      setCollaborators((prev) => {
        if (prev.find((c) => c.userId === user.userId)) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeft = ({ userId }: { userId: string }) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    };

    socket.on("room:current-users", handleCurrentUsers);
    socket.on("room:user-joined", handleUserJoined);
    socket.on("room:user-left", handleUserLeft);

    if (roomId) socket.emit("room:get-users", roomId);

    return () => {
      socket.off("room:current-users", handleCurrentUsers);
      socket.off("room:user-joined", handleUserJoined);
      socket.off("room:user-left", handleUserLeft);
    };
  }, [socket, currentUserId, roomId]);

  return collaborators;
};
