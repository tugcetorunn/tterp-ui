import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Payment {
  id: number;
  orderId: number;
  paymentDate: string;
  paymentType: number;
  paymentTypeName?: string | null;
  paymentStatus: number;
  paymentStatusName?: string | null;
  amount: number;
  currency: number;
  currencyName?: string | null;
  note?: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreatePaymentRequest {
  orderId: number;
  paymentDate: string;
  paymentType?: number | null;
  paymentStatus?: number | null;
  amount: number;
  currency: number;
  note?: string | null;
}

export interface PaymentListParams {
  orderId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export const paymentService = {
  async getList(params?: PaymentListParams): Promise<Payment[]> {
    const response = await apiClient.get("/Payments/GetList", {
      params,
    });

    return extractData<Payment[]>(response);
  },

  async create(data: CreatePaymentRequest): Promise<number> {
    const response = await apiClient.post("/Payments/Create", data);

    return extractData<number>(response);
  },
};
