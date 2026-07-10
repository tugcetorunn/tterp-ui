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
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Beklenmeyen bir hata oluştu.";
}