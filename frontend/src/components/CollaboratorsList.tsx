import { useActiveCollaborators, type Collaborator } from "../hooks/useActiveCollaborators";
import { Socket } from "socket.io-client";

const AVATAR_COLORS = [
  "#ff6b6b", "#51cf66", "#339af0", "#f06595",
  "#cc5de8", "#ff922b", "#20c997", "#fcc419",
];

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "badge-warning" },
  editor: { label: "Editor", className: "badge-info" },
  viewer: { label: "Viewer", className: "badge-ghost" },
};

const CollaboratorsList = ({
  socket,
  currentUserId,
}: {
  socket: Socket | null;
  currentUserId: string | undefined;
}) => {
  const collaborators = useActiveCollaborators(socket, currentUserId);

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-3 h-full">
      <div className="flex -space-x-2">
        {collaborators.map((c, i) => (
          <div
            key={c.userId}
            className="w-7 h-7 rounded-full flex items-center justify-center
                       text-[11px] font-bold text-white border-2 border-base-100
                       transition-transform hover:scale-110 hover:z-10 relative group"
            style={{
              backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            }}
          >
            {c.name.charAt(0).toUpperCase()}
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2
                            bg-neutral text-neutral-content text-[10px] px-1.5 py-0.5
                            rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                            transition-opacity pointer-events-none z-20 shadow">
              {c.name}
              <span className="ml-1 opacity-60">({ROLE_BADGES[c.role]?.label || c.role})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaboratorsList;
