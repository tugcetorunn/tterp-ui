import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface SupplierMaterial {
  id: number;

  supplierId: number;
  supplierName?: string | null;

  materialId: number;
  materialName?: string | null;
  materialCode: string;
  materialUnit: number;
  materialUnitName?: string | null;

  currency: number;
  currencyName: string;

  shortCode?: string | null;
  symbol?: string | null;

  listPrice: number;
  unitPrice: number;
  taxRate: number;

  leadTimeDays?: number | null;
  moq?: number | null;

  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateSupplierMaterialRequest {
  supplierId: number;
  materialId: number;
  currency: number;
  listPrice: number;
  unitPrice: number;
  leadTimeDays?: number | null;
  moq?: number | null;
}

export interface SupplierMaterialListParams {
  supplierId?: number;
  materialId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export const supplierMaterialService = {
  async getList(
    params?: SupplierMaterialListParams
  ): Promise<SupplierMaterial[]> {
    const response = await apiClient.get(
      "/SupplierMaterials/GetList",
      { params }
    );

    return extractData<SupplierMaterial[]>(response);
  },

  async create(
    data: CreateSupplierMaterialRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/SupplierMaterials/Create",
      data
    );

    return extractData<number>(response);
  },
};