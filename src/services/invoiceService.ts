import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId?: number | null;
  invoiceDate: string;
  currency: number;
  currencyName?: string | null;
  totalAmount: number;
  finalAmount: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateInvoiceRequest {
  orderId?: number | null;
  invoiceDate: string;
  currency: number;
}

export interface InvoiceListParams {
  orderId?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}

export const invoiceService = {
  async getList(params?: InvoiceListParams): Promise<Invoice[]> {
    const response = await apiClient.get("/Invoices/GetList", {
      params,
    });

    return extractData<Invoice[]>(response);
  },

  async create(data: CreateInvoiceRequest): Promise<number> {
    const response = await apiClient.post("/Invoices/Create", data);

    return extractData<number>(response);
  },
};
