import axios, { AxiosError, type AxiosResponse } from "axios";
import { toast } from "react-toastify";

export const authRequest = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Authorization: "Bearer test" },
});

export const unAuthRequest = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

authRequest.interceptors.response.use(
  (res: AxiosResponse<any>) => {
    return res;
  },
  (err: AxiosError<any>) => {
    console.log(err);
    toast.error(err.message);
    throw new Error(err.message);
  }
);

unAuthRequest.interceptors.response.use(
  (res: AxiosResponse<any>) => {
    console.log(res);
    return res;
  },
  (err: AxiosError<any>) => {
    console.log(err);
    toast.error(err.message);
    throw new Error(err.message);
  }
);
