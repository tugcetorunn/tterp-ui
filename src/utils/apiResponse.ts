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

export interface ApiErrorResponse {
  data?: unknown;
  isSuccess?: boolean;
  message?: string | null;
  errors?: string[] | null;
  statusCode?: number;
}

export function getErrorMessage(
  error: unknown
): string {
  if (
    axios.isAxiosError<ApiErrorResponse>(
      error
    )
  ) {
    const responseData =
      error.response?.data;

    if (
      responseData?.errors &&
      responseData.errors.length > 0
    ) {
      return responseData.errors.join(
        "\n"
      );
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (
      error.code ===
      "ERR_NETWORK"
    ) {
      return "Sunucuya ulaşılamadı. Backend servisinin çalıştığını kontrol edin.";
    }

    if (error.response?.status === 401) {
      return "Oturum süreniz dolmuş veya yetkiniz bulunmuyor.";
    }

    if (error.response?.status === 403) {
      return "Bu işlem için yetkiniz bulunmuyor.";
    }

    if (error.response?.status === 404) {
      return "İstenen kayıt veya servis bulunamadı.";
    }

    if (
      error.response?.status &&
      error.response.status >= 500
    ) {
      return (
        responseData?.message ||
        "Sunucuda beklenmeyen bir hata oluştu."
      );
    }

    return (
      error.message ||
      "İşlem sırasında bir hata oluştu."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Beklenmeyen bir hata oluştu.";
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

// export function getErrorMessage(error: unknown): string {
//   if (axios.isAxiosError(error)) {
//     const responseData = error.response?.data;

//     if (
//       responseData &&
//       typeof responseData === "object" &&
//       "message" in responseData &&
//       typeof responseData.message === "string"
//     ) {
//       return responseData.message;
//     }

//     if (typeof error.message === "string") {
//       return error.message;
//     }
//   }

//   if (error instanceof Error) {
//     return error.message;
//   }

//   if (typeof error === "string") {
//     return error;
//   }

//   return "Beklenmeyen bir hata oluştu.";
// }