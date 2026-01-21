import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-toastify";
import { store } from "../redux/store";

export const authRequest = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Authorization: "Bearer " },
});

export const unAuthRequest = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

authRequest.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state?.user?.user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      return Promise.reject();
    }

    return config;
  },
  (error) => Promise.reject(error),
);

authRequest.interceptors.response.use(
  (res: AxiosResponse<any>) => {
    return res;
  },
  (err: AxiosError<any>) => {
    console.log(err);
    toast.error(err.message);
    throw new Error(err.message);
  },
);

unAuthRequest.interceptors.response.use(
  (res: AxiosResponse<any>) => {
    return res;
  },
  (err: AxiosError<any>) => {
    console.log(err);
    toast.error(err.message);
    throw new Error(err.message);
  },
);
