import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { unAuthRequest } from "../utils/axios.interceptor";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/slices/user.slice";
import { useGoogleLogin } from "@react-oauth/google";

export const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state?.user);
  const navigate = useNavigate();

  const handleInput = (e: any) => {
    setFormData((currData) => ({
      ...currData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await unAuthRequest.post("auth/login", formData);
      dispatch(login({ token: res.data }));
      navigate("/create-room");
    } catch (err) {}
  };

  const googleLoginHandler = async (response: any) => {
    try {
      const res = await unAuthRequest.post("auth/google/code", {
        code: response.code,
      });
      dispatch(login({ token: res.data }));
      navigate("/create-room");
    } catch (err) {}
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: googleLoginHandler,
    onError: () => {
      console.log("Login Failed");
    },
    flow: "auth-code",
  });

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse w-full h-full gap-20">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Login now!</h1>
          <p className="py-6">
            Login and Create your own room to start coding.
          </p>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleLogin}>
            <fieldset className="fieldset">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleInput}
              />
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInput}
              />
              <div>
                Don't have any account?{" "}
                <Link className="link link-hover" to={"/register"}>
                  Register Now
                </Link>
              </div>
              <button className="btn btn-neutral mt-4" type="submit">
                Login
              </button>
              <button
                className="btn btn-neutral mt-4"
                onClick={handleGoogleLogin}
                type="button"
              >
                Login With Google
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
};
