export interface ApiResponse<T> {
  data: T | null;
  isSuccess: boolean;
  message?: string | null;
  errors?: string[] | null;
  statusCode: number;
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
        body.errors?.join(", ") || body.message || "İşlem başarısız.";
      throw new Error(message);
    }

    return body.data as T;
  }

  return axiosResponse.data as T;
}