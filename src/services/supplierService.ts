import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Supplier {
  id: number;
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
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