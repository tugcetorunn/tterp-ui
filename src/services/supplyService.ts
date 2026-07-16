import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface SupplyItem {
  id: number;
  supplyId?: number;

  supplierMaterialId: number;

  materialId: number;
  materialName?: string | null;
  materialCode?: string | null;
  materialUnit?: number | null;
  materialUnitName?: string | null;

  warehouseId: number;
  warehouseName?: string | null;
  warehouseCode?: string | null;

  quantity: number;

  currency: number;
  currencyName?: string | null;
  currencyShortCode?: string | null;
  currencySymbol?: string | null;

  listPrice: number;
  unitPrice: number;

  discountRate: number;

  taxRate: number;
  netAmount: number;
  taxAmount: number;
  totalPrice: number;

  isActive: boolean;
  isDeleted: boolean;
}

export interface Supply {
  id: number;
  totalAmount: number;
  supplyDate: string;
  deliveryDate?: string | null;
  documentNumber?: string | null;

  supplyStatus?: number | null;
  supplyStatusName?: string | null;
  supplyStatusShortCode?: string | null;
  supplyStatusBadgeColor?: string | null;
  supplyStatusIcon?: string | null;

  employeeId?: number | null;
  employeeName?: string | null;

  supplierId?: number | null;
  supplierName?: string | null;

  supplyItems?: SupplyItem[] | null;
  allowedTransitions: AllowedWorkflowTransition[];
  actions: SupplyActions;

  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateSupplyItemRequest {
  supplierMaterialId: number;
  warehouseId: number;
  quantity: number;
  unitPrice?: number | null;
  discountRate: number;
}

export interface CreateSupplyRequest {
  totalAmount: number;
  supplyDate: string;
  supplyStatus?: number | null;
  supplierId: number;
  supplyItems: CreateSupplyItemRequest[];
}

export interface AddSupplyItemRequest {
  supplyId: number;
  supplierMaterialId: number;
  warehouseId: number;
  quantity: number;
  unitPrice?: number | null;
  discountRate: number;
}

export interface SupplyListParams {
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface AllowedWorkflowTransition {
  targetStatusCode: number;
  statusName: string;
  statusShortCode?: string | null;
  actionName: string;
  badgeColor?: string | null;
  icon?: string | null;
  requiresConfirmation: boolean;
}

export interface SupplyActions {
  canEdit: boolean;
  canDelete: boolean;
  canAddItem: boolean;
  canCancel: boolean;
  canPrint: boolean;
}

export interface ChangeSupplyStatusRequest {
  supplyId: number;
  targetStatusCode: number;
  documentNumber?: string | null;
  note?: string | null;
}

export const supplyService = {
  async getList(params?: SupplyListParams): Promise<Supply[]> {
    const response = await apiClient.get("/Supplies/GetList", {
      params,
    });

    return extractData<Supply[]>(response);
  },

  async create(data: CreateSupplyRequest): Promise<number> {
    const response = await apiClient.post(
      "/Supplies/Create",
      data
    );

    return extractData<number>(response);
  },

  async complete(supplyId: number): Promise<number> {
    const response = await apiClient.post(
      "/Supplies/CompleteSupply",
      {
        supplyId,
      }
    );

    return extractData<number>(response);
  },

  async addItem(data: AddSupplyItemRequest): Promise<number> {
    const response = await apiClient.post(
      "/Supplies/AddItem",
      data
    );

    return extractData<number>(response);
  },

  async changeStatus(data: ChangeSupplyStatusRequest): Promise<number> {
    const response = await apiClient.post("/Supplies/ChangeStatus", data);
    return extractData<number>(response);
  },
};

export interface ChangeSupplyStatusRequest {
  supplyId: number;
  targetStatusCode: number;
  note?: string | null;
}

