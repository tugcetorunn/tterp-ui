import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Material {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  unit: number;
  unitName?: string | null;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  supplierCount: number;
  warehouseCount: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateMaterialRequest {
  name: string;
  code: string;
  description?: string | null;
  unit: number;
  costPrice: number;
  taxRate: number;
  stockQuantity?: number | null;
}

export interface SupplierMaterial {
  id: number;
  supplierId: number;
  supplierName?: string | null;
  materialId: number;
  materialName?: string | null;
  materialCode: string;
  materialUnit?: number;
  materialUnitName?: string | null;
  currency: number;
  currencyName: string;
  listPrice: number;
  unitPrice: number;
  leadTimeDays?: number | null;
  moq?: number | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface MaterialWarehouse {
  id: number;
  materialId: number;
  materialName: string;
  materialCode: string;
  materialUnit?: number;
  materialUnitName?: string | null;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  isActive: boolean;
  isDeleted: boolean;
}

export const materialService = {
  async getList(): Promise<Material[]> {
    const response = await apiClient.get("/Materials/GetList");

    return extractData<Material[]>(response);
  },

  async create(data: CreateMaterialRequest): Promise<number> {
    const response = await apiClient.post("/Materials/Create", data);

    return extractData<number>(response);
  },

  async getSupplierMaterials(
    materialId: number
  ): Promise<SupplierMaterial[]> {
    const response = await apiClient.get(
      "/SupplierMaterials/GetList",
      {
        params: { materialId },
      }
    );

    return extractData<SupplierMaterial[]>(response);
  },

  async getWarehouseStocks(
    materialId: number
  ): Promise<MaterialWarehouse[]> {
    const response = await apiClient.get(
      "/MaterialWarehouses/GetList",
      {
        params: { materialId },
      }
    );

    return extractData<MaterialWarehouse[]>(response);
  },
};