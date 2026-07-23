import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface LookupOption {
  id: number;
  name: string;
}

export interface RoleLookupOption {
  id: number;
  nameForUI: string;
}

export const organizationService = {
  async getRoles(): Promise<RoleLookupOption[]> {
    const response = await apiClient.get(
      "/Roles/GetList"
    );

    return extractData<RoleLookupOption[]>(
      response
    );
  },

  async getTitles(): Promise<LookupOption[]> {
    const response = await apiClient.get(
      "/Titles/GetList"
    );

    return extractData<LookupOption[]>(
      response
    );
  },

  async getTeams(): Promise<LookupOption[]> {
    const response = await apiClient.get(
      "/Teams/GetList"
    );

    return extractData<LookupOption[]>(
      response
    );
  },
};