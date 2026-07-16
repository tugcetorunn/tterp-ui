import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface AllowedWorkflowTransition {
  targetStatusCode: number;
  statusName: string;
  statusShortCode?: string | null;
  actionName: string;
  badgeColor?: string | null;
  icon?: string | null;
  requiresConfirmation: boolean;
}

export interface WorkflowActionPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAddItem: boolean;
  canCancel: boolean;
  canPrint: boolean;
}

export interface ProductionItem {
  id: number;
  productionId: number;

  materialId: number;
  materialName?: string | null;
  materialCode?: string | null;
  materialUnit?: number | null;
  materialUnitName: string | null;

  sourceWarehouseId: number;
  sourceWarehouseName?: string | null;
  sourceWarehouseCode?: string | null;

  plannedQuantity: number;
  reservedQuantity?: number;
  consumedQuantity?: number;

  actualQuantity?: number | null;
  scrapQuantity?: number | null;

  reservationReleased?: boolean;

  isActive: boolean;
  isDeleted: boolean;
}

export interface Production {
  id: number;

  productId: number;
  productName?: string | null;
  productCode?: string | null;

  productionDate: string;
  startedDate?: string | null;
  completedDate?: string | null;

  plannedQuantity: number;
  actualQuantity?: number | null;

  targetWarehouseId: number;
  targetWarehouseName?: string | null;
  targetWarehouseCode?: string | null;

  productionStatus?: number | null;
  productionStatusName?: string | null;
  productionStatusShortCode?: string | null;
  productionStatusBadgeColor?: string | null;
  productionStatusIcon?: string | null;

  productionItems: ProductionItem[];
  allowedTransitions: AllowedWorkflowTransition[];
  actions: WorkflowActionPermissions;

  workflowHistories?: WorkflowHistory[] | null;
  productionProgresses?: ProductionProgress[] | null;

  isActive: boolean;
  isDeleted: boolean;
}

export interface PlanProductionItemRequest {
  materialId: number;
  sourceWarehouseId: number;
  plannedQuantity: number;
}

export interface PlanProductionRequest {
  productId: number;
  plannedQuantity: number;
  targetWarehouseId: number;
  productionDate: string;
  productionItems: PlanProductionItemRequest[];
}

export interface CompleteProductionItemRequest {
  productionItemId: number;
  actualQuantity: number;
  scrapQuantity: number;
}

export interface ChangeProductionStatusRequest {
  productionId: number;
  targetStatusCode: number;
  actualQuantity?: number | null;
  productionItems?: CompleteProductionItemRequest[] | null;
  note?: string | null;
}

export interface ProductionListParams {
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface AddProductionProgressRequest {
  productionId: number;
  producedQuantity: number;
  note?: string | null;
}

export interface ProductionProgress {
  id: number;
  productionId: number;
  producedQuantity: number;
  note?: string | null;
  progressDate: string;
  employeeId?: number | null;
  employeeName?: string | null;
}

export interface WorkflowHistory {
  id: number;
  workflowType: number;
  recordId: number;
  fromStatusCode?: number | null;
  fromStatusName?: string | null;
  toStatusCode: number;
  toStatusName?: string | null;
  employeeId: number;
  employeeName?: string | null;
  note?: string | null;
  changeDate: string;
}

export const productionService = {
  async getList(
    params?: ProductionListParams
  ): Promise<Production[]> {
    const response = await apiClient.get(
      "/Productions/GetList",
      { params }
    );

    return extractData<Production[]>(response);
  },

  async plan(
    data: PlanProductionRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/Productions/Plan",
      data
    );

    return extractData<number>(response);
  },

  async changeStatus(
        data: ChangeProductionStatusRequest
    ): Promise<number> {
        const response = await apiClient.post(
        "/Productions/ChangeStatus",
        data
        );

        return extractData<number>(response);
    },
    async addProgress(
    data: AddProductionProgressRequest
    ): Promise<number> {
    const response = await apiClient.post(
        "/ProductionProgresses/AddProgress",
        data
    );

    return extractData<number>(response);
    },
};