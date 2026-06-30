import { useEffect, useState } from "react";
import { authRequest } from "../utils/axios.interceptor";
import { Link } from "react-router-dom";

import { RiDeleteBin2Line, RiEdit2Line } from "react-icons/ri";
import { FaLongArrowAltRight } from "react-icons/fa";
import { toast } from "react-toastify";

type RoomDetail = {
  _id: string;

  slug: string;

  name: string;

  lang: string;

  role: string;
};

const Rooms = () => {
  const [rooms, setRooms] = useState<RoomDetail[] | undefined>();

  const getAllRooms = async () => {
    try {
      const roomData = await authRequest.get("/rooms");
      setRooms(roomData.data);
    } catch (err) {}
  };

  const handleRoomDelete = async (roomId: string) => {
    try {
      await authRequest.delete(`/rooms/${roomId}`);

      setRooms((rooms) => rooms?.filter((room) => room._id != roomId));
    } catch (err) {}
  };

  useEffect(() => {
    getAllRooms();
  }, []);

  return (
    <div className="bg-base-200 min-h-screen p-16 flex flex-col gap-4 overflow-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rooms</h1>
        <Link to={"/create-room"} className="btn btn-accent rounded-lg">
          Create new
        </Link>
      </div>
      <div className="w-full grid grid-cols-3 md:grid-cols-5 gap-5 ">
        {rooms && rooms.length > 0 ? rooms?.map((room: RoomDetail) => (
          <div
            className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl"
            key={room._id}
          >
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title text-2xl capitalize wrap-anywhere">
                  {room?.name}
                </h2>
                {room.role == "owner" && (
                  <div className="flex gap-2">
                    <Link
                      className="btn bg-info/80 btn-circle btn-xs text-gray-200"
                      to={`/update-room/${room._id}`}
                      title="Info"
                    >
                      <RiEdit2Line size={14} />
                    </Link>
                    <button
                      className="btn bg-error/80 btn-circle btn-xs text-gray-200"
                      onClick={() => {
                        handleRoomDelete(room._id);
                      }}
                      title="Delete"
                    >
                      <RiDeleteBin2Line size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body p-0 gap-4">
                <p className="badge badge-sm badge-dash capitalize">
                  {room.lang}
                </p>
                <p className="capitalize">Role: {room.role}</p>
                <Link
                  to={`/room/${room.slug}`}
                  className="btn btn-soft btn-sm btn-accent"
                >
                  Enter Room <FaLongArrowAltRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">No rooms yet</h3>
            <p className="mb-6 text-sm">Create your first room to start collaborating!</p>
            <Link to={"/create-room"} className="btn btn-accent rounded-lg">
              Create Room
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
