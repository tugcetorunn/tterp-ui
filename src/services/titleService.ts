import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Title {
  id: number;
  name: string;
  description?: string | null;
  employeeCount: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateTitleRequest {
  name: string;
  description?: string | null;
}

export interface GetTitlesParams {
  isActive?: boolean;
  isDeleted?: boolean;
}

export const titleService = {
  async getList(
    params?: GetTitlesParams
  ): Promise<Title[]> {
    const response = await apiClient.get(
      "/Titles/GetList",
      {
        params,
      }
    );

    return extractData<Title[]>(
      response
    );
  },

  async create(
    request: CreateTitleRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/Titles/Create",
      request
    );

    return extractData<number>(
      response
    );
  },
};