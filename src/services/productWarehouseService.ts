import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface ProductWarehouseMovement {
  id: number;

  productId: number;
  productName?: string | null;

  warehouseId: number;
  warehouseName?: string | null;

  quantity: number;

  reasonForEntryOrExit: number;
  reasonForEntryOrExitName?: string | null;

  isActive: boolean;
  isDeleted: boolean;
}

export interface ProductStock {
  productId: number;
  productName?: string | null;
  productCode?: string | null;

  warehouseId: number;
  warehouseName?: string | null;
  warehouseCode?: string | null;

  totalQuantity: number;

  isActive: boolean;
  isDeleted: boolean;
}

export interface ProductWarehouseListParams {
  productId?: number;
  warehouseId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface ProductStockListParams {
  productId?: number;
  warehouseId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface CreateProductWarehouseRequest {
  productId: number;
  warehouseId: number;
  quantity: number;
  reasonForEntryOrExit: number;
}

export const productWarehouseService = {
  async getList(
    params?: ProductWarehouseListParams
  ): Promise<ProductWarehouseMovement[]> {
    const response = await apiClient.get(
      "/ProductWarehouses/GetList",
      { params }
    );

    return extractData<ProductWarehouseMovement[]>(response);
  },

  async getStockList(
    params?: ProductStockListParams
  ): Promise<ProductStock[]> {
    const response = await apiClient.get(
      "/ProductWarehouses/GetStockList",
      { params }
    );

    return extractData<ProductStock[]>(response);
  },

  async create(
    data: CreateProductWarehouseRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/ProductWarehouses/Create",
      data
    );

    return extractData<number>(response);
  },
};