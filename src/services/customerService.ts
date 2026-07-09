import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Customer {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  taxNumber: string;
  customerType?: number | null;
  email: string;
  phoneNumber: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  createdBy: string;
  createdDate: Date;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateCustomerRequest {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  taxNumber: string;
  customerType?: number | null;
  email: string;
  phoneNumber: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export const customerService = {
  async getList(): Promise<Customer[]> {
    const response = await apiClient.get("/Customers/GetList");
    return extractData<Customer[]>(response);
  },

  async create(data: CreateCustomerRequest): Promise<number> {
    const response = await apiClient.post("/Customers/Create", data);
    return extractData<number>(response);
  },
};