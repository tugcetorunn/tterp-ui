import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  createdDate?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export const categoryService = {
  async getList(): Promise<Category[]> {
    const response = await apiClient.get("/Categories/GetList");
    return extractData<Category[]>(response);
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post("/Categories/Create", data);
    return extractData<Category>(response);
  },
};