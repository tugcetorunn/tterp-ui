import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface WarehouseMaterial {
  id: number;
  materialId: number;
  materialName: string;
  materialCode: string;
  materialUnit: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface WarehouseProduct {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;

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

  addressLine: string;

  materialWarehouses?: WarehouseMaterial[] | null;
  productWarehouses?: WarehouseProduct[] | null;

  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  countryId: number;
  cityId: number;
  townId: number;
  districtId: number;
  neighborhoodId: number;
  addressLine: string;
}

export const warehouseService = {
  async getList(): Promise<Warehouse[]> {
    const response = await apiClient.get("/Warehouses/GetList");

    return extractData<Warehouse[]>(response);
  },

  async create(
    data: CreateWarehouseRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/Warehouses/Create",
      data
    );

    return extractData<number>(response);
  },
};