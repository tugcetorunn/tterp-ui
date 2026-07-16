import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

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

  reasonForEntryOrExit?: number | null;
  reasonForEntryOrExitName?: string | null;

  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateMaterialWarehouseRequest {
  materialId: number;
  warehouseId: number;
  quantity: number;
  reasonForEntryOrExit: number;
}

export interface MaterialWarehouseListParams {
  materialId?: number;
  warehouseId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface MaterialStock {
  materialId: number;
  materialName: string;
  materialCode: string;
  materialUnit: number;
  materialUnitName?: string | null;

  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;

  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;

  isActive: boolean;
  isDeleted: boolean;
}

export interface MaterialStockListParams {
  materialId?: number;
  warehouseId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface MaterialStockTimelineItem {
  recordType: "Movement" | "Reservation";
  recordId: number;

  materialId: number;
  materialName?: string | null;
  materialCode?: string | null;

  warehouseId: number;
  warehouseName?: string | null;
  warehouseCode?: string | null;

  quantity: number;

  reasonCode?: number | null;
  reasonName?: string | null;

  materialUnit?: number;
  materialUnitName?: string | null;

  productionId?: number | null;

  transactionDate: string;

  isReservation: boolean;
  isReleased: boolean;
}

export const materialWarehouseService = {
  async getList(
    params?: MaterialWarehouseListParams
  ): Promise<MaterialWarehouse[]> {
    const response = await apiClient.get(
      "/MaterialWarehouses/GetList",
      {
        params,
      }
    );

    return extractData<MaterialWarehouse[]>(response);
  },

  async create(
    data: CreateMaterialWarehouseRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/MaterialWarehouses/Create",
      data
    );

    return extractData<number>(response);
  },

  async getStockList(
    params?: MaterialStockListParams
  ): Promise<MaterialStock[]> {
    const response = await apiClient.get(
      "/MaterialWarehouses/GetStockList",
      { params }
    );

    return extractData<MaterialStock[]>(response);
  },

  async getTimeline(params?: {
  materialId?: number;
  warehouseId?: number;
}): Promise<MaterialStockTimelineItem[]> {
  const response = await apiClient.get(
    "/MaterialWarehouses/GetTimeline",
    { params }
  );

  return extractData<MaterialStockTimelineItem[]>(
    response
  );
},
};

