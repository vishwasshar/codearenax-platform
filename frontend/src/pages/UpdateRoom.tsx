import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LangTypes } from "../commons/vars/lang-types";
import { authRequest } from "../utils/axios.interceptor";
import { Link, useParams } from "react-router-dom";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { debounce } from "../utils/debounce";
import { RoomRoleTypes } from "../commons/vars/room-role-types";
import { toast } from "react-toastify";

type User = {
  name: string;
  _id: string;
  email: string;
};

type AccessListItem = {
  _id: string;
  user: any;
  role: string;
};

export const UpdateRoom = () => {
  const [formData, setFormData] = useState({
    name: "",
    lang: "",
  });

  const [newAccess, setNewAccess] = useState({
    _id: "",
    name: "",
    email: "",
    role: "viewer",
  });

  const [accessList, setAccessList] = useState<AccessListItem[]>([]);

  const [userSuggestions, setUserSuggestions] = useState<User[] | undefined>();
  const [suggestionActive, setSuggestionActive] = useState(false);

  const { roomId } = useParams();

  const handleInput = (e: any) => {
    setFormData((currData) => ({
      ...currData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAccessInput = (e: any) => {
    setNewAccess((currData) => ({
      ...currData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await authRequest.put(`/rooms/${roomId}`, formData);

      toast.success("Success:Room Updated");
    } catch (err) {
      console.log(err);
    }
  };

  const handleNewAccess = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (!newAccess._id) {
        toast.error("Please select user from Suggestions");
        return;
      }
      if (!newAccess.role) {
        toast.error("Please select a role");
        return;
      }

      const res = await authRequest.post(`/rooms/${roomId}/access`, {
        userId: newAccess._id,
        role: newAccess.role,
      });

      if (res.data) setAccessList((curr) => [...curr, res.data]);

      setNewAccess({
        _id: "",
        name: "",
        email: "",
        role: "viewer",
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleAccessDelete = async (userId: string) => {
    try {
      await authRequest.delete(`/rooms/${roomId}/access/${userId}`);

      setAccessList((curr) => curr.filter((a: any) => a?.user?._id != userId));
    } catch (err) {}
  };

  const getRoomDetails = async () => {
    try {
      const roomDetail = await authRequest.get(`/rooms/${roomId}`);

      const { accessList, ...formData } = roomDetail.data;

      setFormData(formData);
      setAccessList(accessList);
    } catch (err) {}
  };

  const searchUsers = async (keyword: string) => {
    try {
      const users = await authRequest.get(`/users?keyword=${keyword}`);

      setUserSuggestions(users.data);
    } catch (err) {}
  };

  const debouncedUserSearch = useMemo(() => debounce(searchUsers), []);

  useEffect(() => {
    if (newAccess.email) debouncedUserSearch(newAccess.email);
  }, [newAccess.email]);

  useEffect(() => {
    getRoomDetails();
  }, [roomId]);

  return (
    <div className=" bg-base-200 min-h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col items-center gap-5">
        <h1 className="text-3xl font-bold">Update Room</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card bg-base-100 w-xs shadow-2xl">
            <form className="card-body" onSubmit={handleSubmit}>
              <h3 className="text-xl capitalize">{formData.name || "."}</h3>
              <fieldset className="fieldset">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Room Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInput}
                />
                <label className="label">Language</label>
                <select
                  value={formData.lang}
                  className="select capitalize"
                  name="lang"
                  onChange={(e: any) => {
                    setFormData((currData) => ({
                      ...currData,
                      lang: e.target.value,
                    }));
                  }}
                >
                  <option disabled={true}>Pick a Language</option>
                  {LangTypes.map((lang) => (
                    <option value={lang} key={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <button className="btn btn-neutral mt-4" type="submit">
                  Update
                </button>
              </fieldset>
            </form>
          </div>
          <div className="card bg-base-100 w-xs shadow-2xl">
            <form className="card-body" onSubmit={handleNewAccess}>
              <h3 className="text-xl">New Access</h3>
              <fieldset className="fieldset">
                <div className="relative w-full max-w-md">
                  <label className="label w-full mb-1">Add User</label>
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    className="input input-bordered w-full"
                    onFocus={() => {
                      setSuggestionActive(true);
                    }}
                    onBlur={() => {
                      setSuggestionActive(false);
                    }}
                    value={newAccess.email}
                    onChange={(e) => {
                      setNewAccess((curr) => ({
                        ...curr,
                        email: e.target.value,
                      }));
                    }}
                  />
                  {suggestionActive && (
                    <ul className="absolute z-10 mt-1 w-full rounded-box bg-base-100 shadow">
                      {userSuggestions?.map((user) => (
                        <li
                          className="cursor-pointer px-4 py-2 hover:bg-base-200 capitalize text-left"
                          key={user._id}
                          onMouseDown={() => {
                            setNewAccess((curr) => ({
                              ...curr,
                              ...user,
                            }));
                          }}
                        >
                          {user?.name} - {user.email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <label className="label">Role</label>
                <select
                  className="select capitalize"
                  name="role"
                  onChange={handleAccessInput}
                  value={newAccess.role}
                >
                  <option disabled={true}>Pick a Role</option>
                  {RoomRoleTypes.map((role) => (
                    <option value={role} key={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <button className="btn btn-neutral mt-4" type="submit">
                  Add Access
                </button>
              </fieldset>
            </form>
          </div>
          {accessList && (
            <div className="card md:col-span-2 bg-base-100 shadow-2xl w-xs md:w-2xl">
              <div className="card-body">
                <h3 className="text-xl">Room Access</h3>
                <div className="flex flex-wrap gap-2">
                  {accessList?.map((u: any) => (
                    <button
                      disabled={u.role == "owner"}
                      className="btn btn-sm w-fit hover:bg-error"
                      key={u?._id}
                      onClick={() => handleAccessDelete(u.user._id)}
                    >
                      {u?.user?.email} - {u?.role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <Link
          to={"/rooms"}
          className="btn btn-ghost underline mt-2"
          type="submit"
        >
          <FaLongArrowAltLeft size={14} /> All Rooms
        </Link>
      </div>
    </div>
  );
};
