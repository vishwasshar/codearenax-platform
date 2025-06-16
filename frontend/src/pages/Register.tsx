import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { unAuthRequest } from "../utils/axios.interceptor";

export const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleInput = (e: any) => {
    setFormData((currData) => ({
      ...currData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await unAuthRequest.post("/users", formData);

      console.log(res);
      if (res.status == 201) navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse w-full h-full gap-20">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Register now!</h1>
          <p className="py-6">
            Register and Create your own room to start coding.
          </p>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleRegister}>
            <fieldset className="fieldset">
              <label className="label">Name</label>
              <input
                type="text"
                className="input"
                placeholder="Name"
                name="name"
                onChange={handleInput}
              />
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="Email"
                name="email"
                onChange={handleInput}
              />
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Password"
                name="password"
                onChange={handleInput}
              />
              <div>
                Already have account?
                <Link className="link link-hover" to={"/login"}>
                  {" "}
                  Login Now
                </Link>
              </div>
              <button className="btn btn-neutral mt-4" type="submit">
                Register
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
};
