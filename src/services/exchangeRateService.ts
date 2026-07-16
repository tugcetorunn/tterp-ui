import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface ExchangeRate {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  price: number;
  previousPrice?: number | null;
  change: number;
  changePercentage: number;
  isIncreasing: boolean;
  isDecreasing: boolean;
  updatedAt: string;
  source: string;
}

export async function getCurrentExchangeRates(): Promise<ExchangeRate[]> {
  const response = await apiClient.get("/ExchangeRates/GetCurrentRates");
  return extractData<ExchangeRate[]>(response.data);
}