import { useEffect } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentExchangeRates,
  type ExchangeRate,
} from "../services/exchangeRateService";

const exchangeRateQueryKey = ["exchange-rates"];

export function useExchangeRates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: exchangeRateQueryKey,
    queryFn: getCurrentExchangeRates,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string;

    // VITE_API_BASE_URL örneğin:
    // https://localhost:7133/api
    // Hub adresinde /api yok.
    const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

    const connection = new HubConnectionBuilder()
      .withUrl(`${backendBaseUrl}/hubs/exchange-rates`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.on(
      "ExchangeRatesSnapshot",
      (rates: ExchangeRate[]) => {
        queryClient.setQueryData<ExchangeRate[]>(
          exchangeRateQueryKey,
          rates
        );
      }
    );

    connection.on(
      "ExchangeRateUpdated",
      (updatedRate: ExchangeRate) => {
        queryClient.setQueryData<ExchangeRate[]>(
          exchangeRateQueryKey,
          (currentRates = []) => {
            const exists = currentRates.some(
              (rate) => rate.symbol === updatedRate.symbol
            );

            if (!exists) {
              return [...currentRates, updatedRate];
            }

            return currentRates.map((rate) =>
              rate.symbol === updatedRate.symbol
                ? updatedRate
                : rate
            );
          }
        );
      }
    );

    const startConnection = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
        }
      } catch (error) {
        console.error("SignalR bağlantısı kurulamadı:", error);
      }
    };

    void startConnection();

    return () => {
      connection.off("ExchangeRatesSnapshot");
      connection.off("ExchangeRateUpdated");
      void connection.stop();
    };
  }, [queryClient]);

  return query;
}