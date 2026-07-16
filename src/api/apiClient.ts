import axios from "axios";
// import { ApiError } from "../utils/apiResponse";
import { toast } from "sonner";

import {
  getErrorMessage,
} from "../utils/apiResponse";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  // (error) => {
  //   const statusCode = error.response?.status;
  //   const data = error.response?.data;

  //   if (statusCode === 401) {
  //     localStorage.removeItem("accessToken");
  //     window.location.href = "/login";
  //     return Promise.reject(
  //       new ApiError("Oturum süreniz doldu. Lütfen tekrar giriş yapın.", 401)
  //     );
  //   }

  //   const message =
  //     data?.errors?.join("\n") ||
  //     data?.message ||
  //     error.message ||
  //     "Beklenmeyen bir hata oluştu.";

  //   return Promise.reject(
  //     new ApiError(message, statusCode, data?.errors ?? [])
  //   );
  // }

  (error) => {
    const status =
      error.response?.status;

    const requestUrl =
      error.config?.url ?? "";

    const isLoginRequest =
      requestUrl.includes("/Auth/Login");

    const message =
      getErrorMessage(error);

    if (!isLoginRequest) {
      toast.error(message, {
        duration: 5000,
      });
    }

    if (status === 401) {
      localStorage.removeItem(
        "accessToken"
      );

      if (!isLoginRequest) {
        window.location.href =
          "/login";
      }
    }

    return Promise.reject(error);
  }
);