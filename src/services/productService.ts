import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Product {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  currency: number;
  currencyName: string;
  price: number;
  costPrice?: number | null;
  taxRate: number;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateProductRequest {
  name: string;
  code: string;
  description?: string | null;
  currency: number;
  price: number;
  taxRate: number;
  categoryId: number;
}

export const productService = {
  async getList(): Promise<Product[]> {
    const response = await apiClient.get("/Products/GetList");
    return extractData<Product[]>(response);
  },

  async create(data: CreateProductRequest): Promise<number> {
    const response = await apiClient.post("/Products/Create", data);
    return extractData<number>(response);
  },
};