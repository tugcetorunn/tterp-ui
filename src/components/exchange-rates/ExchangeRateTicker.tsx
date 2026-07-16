import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Radio,
} from "lucide-react";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import type { ExchangeRate } from "../../services/exchangeRateService";

const displayOrder = [
  "OANDA:USD_TRY",
  "OANDA:EUR_TRY",
  "OANDA:EUR_USD",
];

function getDisplayName(rate: ExchangeRate) {
  return `${rate.baseCurrency}/${rate.quoteCurrency}`;
}

function formatPrice(rate: ExchangeRate) {
  const fractionDigits =
    rate.quoteCurrency === "TRY" ? 4 : 5;

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(rate.price);
}

function formatChangePercentage(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    signDisplay: "always",
  }).format(value);
}

export default function ExchangeRateTicker() {
  const { data = [], isLoading, isError } = useExchangeRates();

  const rates = [...data].sort(
    (a, b) =>
      displayOrder.indexOf(a.symbol) -
      displayOrder.indexOf(b.symbol)
  );

  if (isLoading) {
    return (
      <div className="text-sm text-slate-500">
        Kurlar yükleniyor...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-red-500">
        Kur verileri alınamadı.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 xl:flex">
        <Radio className="h-4 w-4 animate-pulse text-emerald-500" />
        Canlı Döviz
      </div>

      <div className="flex items-center divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {rates.map((rate) => (
          <div
            key={rate.symbol}
            className="flex min-w-[130px] items-center justify-between gap-3 px-4 py-2"
          >
            <div>
              <div className="text-xs font-semibold text-slate-500">
                {getDisplayName(rate)}
              </div>

              <div className="text-sm font-bold text-slate-900">
                {formatPrice(rate)}
              </div>
            </div>

            <div
              className={[
                "flex items-center gap-1 text-xs font-semibold",
                rate.isIncreasing
                  ? "text-emerald-600"
                  : rate.isDecreasing
                    ? "text-red-600"
                    : "text-slate-400",
              ].join(" ")}
            >
              {rate.isIncreasing ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : rate.isDecreasing ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}

              {formatChangePercentage(
                rate.changePercentage
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}