import { useState, type FormEvent } from "react";
import { authRequest } from "../utils/axios.interceptor";
import { Link, useNavigate } from "react-router-dom";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { toast } from "react-toastify";

export const CreateRoom = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a room name.");
      return;
    }
    setLoading(true);
    try {
      const res = await authRequest.post("/rooms", { name });
      if (res.status == 201) {
        toast.success("Room created!");
        navigate("/room/" + res.data.slug);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Create Room</h1>
          <p className="py-6">Get started with new Room.</p>
          <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
            <form className="card-body" onSubmit={handleSubmit}>
              <fieldset className="fieldset">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Room Name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button className="btn btn-neutral mt-4" type="submit" disabled={loading}>
                  {loading ? <span className="loading loading-spinner" /> : "Create"}
                </button>
              </fieldset>
            </form>
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
    </div>
  );
};
