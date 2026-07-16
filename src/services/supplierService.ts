import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Supplier {
  id: number;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine?: string | null;
  countryId?: number | null;
  countryName?: string | null;
  cityId?: number | null;
  cityName?: string | null;
  townId?: number | null;
  townName?: string | null;
  districtId?: number | null;
  districtName?: string | null;
  neighborhoodId?: number | null;
  neighborhoodName?: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine?: string | null;
  countryId?: number | null;
  cityId?: number | null;
  townId?: number | null;
  districtId?: number | null;
  neighborhoodId?: number | null;
}

export const supplierService = {
  async getList(): Promise<Supplier[]> {
    const response = await apiClient.get("/Suppliers/GetList");
    return extractData<Supplier[]>(response);
  },

  async create(data: CreateSupplierRequest): Promise<number> {
    const response = await apiClient.post("/Suppliers/Create", data);
    return extractData<number>(response);
  },
};