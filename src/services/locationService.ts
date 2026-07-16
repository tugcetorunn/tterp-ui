import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Country {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
  countryId: number;
}

export interface Town {
  id: number;
  name: string;
  cityId: number;
}

export interface District {
  id: number;
  name: string;
  townId: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  districtId: number;
}

export const locationService = {
  async getCountries(): Promise<Country[]> {
    const response = await apiClient.get("/Locations/Countries");

    return extractData<Country[]>(response);
  },

  async getCities(countryId: number): Promise<City[]> {
    const response = await apiClient.get(
      `/Locations/Countries/${countryId}/Cities`
    );

    return extractData<City[]>(response);
  },

  async getTowns(cityId: number): Promise<Town[]> {
    const response = await apiClient.get(
      `/Locations/Cities/${cityId}/Towns`
    );

    return extractData<Town[]>(response);
  },

  async getDistricts(townId: number): Promise<District[]> {
    const response = await apiClient.get(
      `/Locations/Towns/${townId}/Districts`
    );

    return extractData<District[]>(response);
  },

  async getNeighborhoods(districtId: number): Promise<Neighborhood[]> {
    const response = await apiClient.get(
      `/Locations/Districts/${districtId}/Neighborhoods`
    );

    return extractData<Neighborhood[]>(response);
  },
};