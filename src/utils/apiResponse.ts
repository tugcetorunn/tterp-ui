import axios from "axios";

export interface ApiResponse<T> {
  data: T | null;
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  statusCode: number;
}

export class ApiError extends Error {
  statusCode?: number;
  errors?: string[];

  constructor(message: string, statusCode?: number, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function extractData<T>(response: unknown): T {
  const axiosResponse = response as { data?: ApiResponse<T> | T };
  const body = axiosResponse.data as ApiResponse<T>;

  if (
    body &&
    typeof body === "object" &&
    "isSuccess" in body &&
    "statusCode" in body
  ) {
    if (!body.isSuccess) {
      const message =
        body.errors?.join("\n") ||
        body.message ||
        "İşlem başarısız.";

      throw new ApiError(message, body.statusCode, body.errors ?? []);
    }

    return body.data as T;
  }

  return axiosResponse.data as T;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
    ) {
      return responseData.message;
    }

    if (typeof error.message === "string") {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Beklenmeyen bir hata oluştu.";
}