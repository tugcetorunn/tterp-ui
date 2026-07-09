import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  expiration?: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post("/Auth/Login", data);
    return extractData<LoginResponse>(response);
  },
};