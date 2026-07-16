import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface AllowedWorkflowTransition {
  targetStatusCode: number;
  actionName: string;
  statusName: string;
  statusShortCode?: string | null;
  buttonText?: string | null;
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

export interface OrderItemStockLocation {
  id: number;
  orderItemId: number;
  warehouseId: number;
  warehouseName?: string | null;
  warehouseCode?: string | null;
  quantity: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName?: string | null;
  productCode?: string | null;
  quantity: number;
  currency: number;
  currencyName?: string | null;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
  stockLocations: OrderItemStockLocation[];
  isActive: boolean;
  isDeleted: boolean;
}

export interface Order {
  id: number;
  orderDate: string;
  customerId: number;
  customerName?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;

  orderStatus?: number | null;
  orderStatusName?: string | null;
  orderStatusShortCode?: string | null;
  orderStatusBadgeColor?: string | null;
  orderStatusIcon?: string | null;

  paymentStatus?: number | null;
  paymentStatusName?: string | null;

  shippingStatus?: number | null;
  shippingStatusName?: string | null;

  currency: number;
  currencyName?: string | null;

  totalAmount: number;
  discount: number;
  finalAmount: number;

  allowedTransitions: AllowedWorkflowTransition[];
  actions: WorkflowActionPermissions;
  orderItems: OrderItem[];
  workflowHistories: WorkflowHistory[];

  isActive: boolean;
  isDeleted: boolean;
}

export interface OrderItemStockAllocationRequest {
  warehouseId: number;
  quantityFromWarehouse: number;
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice?: number | null;
  discount: number;
  stockAllocations: OrderItemStockAllocationRequest[];
}

export interface CreateOrderRequest {
  orderDate: string;
  customerId: number;
  discount: number;
  orderItems: CreateOrderItemRequest[];
}

export interface AddOrderItemRequest
  extends CreateOrderItemRequest {
  orderId: number;
}

export interface ChangeOrderStatusRequest {
  orderId: number;
  targetStatusCode: number;
  note?: string | null;
}

export interface OrderListParams {
  isActive?: boolean;
  isDeleted?: boolean;
}

export const orderService = {
  async getList(
    params?: OrderListParams
  ): Promise<Order[]> {
    const response = await apiClient.get(
      "/Orders/GetList",
      { params }
    );

    return extractData<Order[]>(response);
  },

  async create(
    data: CreateOrderRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/Orders/Create",
      data
    );

    return extractData<number>(response);
  },

  async addItem(
    data: AddOrderItemRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/OrderItems/AddItem",
      data
    );

    return extractData<number>(response);
  },

  async changeStatus(
    data: ChangeOrderStatusRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/Orders/ChangeStatus",
      data
    );

    return extractData<number>(response);
  },
};