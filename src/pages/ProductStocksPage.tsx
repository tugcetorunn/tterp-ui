import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Download,
  Eye,
  PackageCheck,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";

import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";

import MultiSelect from "../components/form/MultiSelect";
import SelectInput from "../components/form/SelectInput";

import DetailDrawer from "../components/drawer/DetailDrawer";

import StatusBadge from "../components/common/StatusBadge";
import ActiveStatusBadge from "../components/common/ActiveStatusBadge";

import {
  productWarehouseService,
  type ProductStock,
} from "../services/productWarehouseService";

import { productService } from "../services/productService";
import { warehouseService } from "../services/warehouseService";

import { getErrorMessage } from "../utils/apiResponse";

export default function ProductStocksPage() {
  const [selectedRecord, setSelectedRecord] =
    useState<ProductStock | null>(null);

  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>([]);

  const [selectedWarehouseIds, setSelectedWarehouseIds] =
    useState<string[]>([]);

  const [stockStatusFilter, setStockStatusFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("productName");

  const [sortDirection, setSortDirection] =
    useState("asc");

  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const stocksQuery = useQuery({
    queryKey: ["product-stocks"],
    queryFn: () =>
      productWarehouseService.getStockList(),
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productService.getList,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const stocks = stocksQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        label: `${product.name} (${product.code})`,
        value: String(product.id),
      })),
    [products]
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        label: `${warehouse.name} (${warehouse.code})`,
        value: String(warehouse.id),
      })),
    [warehouses]
  );

  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (item) =>
          item.productName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.productCode
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.warehouseName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.warehouseCode
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (selectedProductIds.length > 0) {
      list = list.filter((item) =>
        selectedProductIds.includes(
          String(item.productId)
        )
      );
    }

    if (selectedWarehouseIds.length > 0) {
      list = list.filter((item) =>
        selectedWarehouseIds.includes(
          String(item.warehouseId)
        )
      );
    }

    if (stockStatusFilter === "positive") {
      list = list.filter(
        (item) => item.totalQuantity > 0
      );
    }

    if (stockStatusFilter === "zero") {
      list = list.filter(
        (item) => item.totalQuantity === 0
      );
    }

    if (stockStatusFilter === "negative") {
      list = list.filter(
        (item) => item.totalQuantity < 0
      );
    }

    if (statusFilter) {
      list = list.filter((item) =>
        statusFilter === "active"
          ? item.isActive
          : !item.isActive
      );
    }

    list.sort((first, second) => {
      let result = 0;

      if (sortBy === "productName") {
        result = (
          first.productName ?? ""
        ).localeCompare(
          second.productName ?? "",
          "tr"
        );
      }

      if (sortBy === "warehouseName") {
        result = (
          first.warehouseName ?? ""
        ).localeCompare(
          second.warehouseName ?? "",
          "tr"
        );
      }

      if (sortBy === "quantity") {
        result =
          first.totalQuantity -
          second.totalQuantity;
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    stocks,
    globalSearchText,
    selectedProductIds,
    selectedWarehouseIds,
    stockStatusFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const getStockBadge = (quantity: number) => {
    if (quantity < 0) {
      return (
        <StatusBadge
          text="Negatif Stok"
          color="danger"
        />
      );
    }

    if (quantity === 0) {
      return (
        <StatusBadge
          text="Stok Yok"
          color="warning"
        />
      );
    }

    return (
      <StatusBadge
        text="Stokta"
        color="success"
      />
    );
  };

  const columns: DataTableColumn<ProductStock>[] = [
    {
      header: "Ürün",

      render: (item) => (
        <button
          type="button"
          onClick={() => setSelectedRecord(item)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {item.productName || "-"}
          </p>

          <p className="text-xs text-slate-400">
            {item.productCode || "-"}
          </p>
        </button>
      ),

      filter: null,
    },
    {
      header: "Depo",

      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">
            {item.warehouseName || "-"}
          </p>

          <p className="text-xs text-slate-400">
            {item.warehouseCode || "-"}
          </p>
        </div>
      ),

      filter: null,
    },
    {
      header: "Güncel Stok",

      render: (item) => (
        <div>
          <p
            className={`text-lg font-bold ${
              item.totalQuantity < 0
                ? "text-red-700"
                : item.totalQuantity === 0
                  ? "text-amber-700"
                  : "text-emerald-700"
            }`}
          >
            {item.totalQuantity.toLocaleString(
              "tr-TR"
            )}
          </p>

          <div className="mt-1">
            {getStockBadge(item.totalQuantity)}
          </div>
        </div>
      ),

      filter: null,
    },
    {
      header: "Durum",

      render: (item) => (
        <ActiveStatusBadge
          isActive={item.isActive}
        />
      ),

      filter: null,
    },
    {
      header: "İşlemler",

      render: (item) => (
        <button
          type="button"
          title="Detay"
          onClick={() => setSelectedRecord(item)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
        >
          <Eye size={16} />
        </button>
      ),

      filter: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ürün Stokları"
        moduleName="Stok Yönetimi"
        description="Ürünlerin depo bazındaki güncel stok durumlarını görüntüleyin."
        rightContent={
          <div className="flex items-center gap-3">
            <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50">
              <Download size={18} />
              Dışa Aktar
            </button>
          </div>
        }
      />

      {stocksQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(stocksQuery.error)}
        </div>
      )}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="w-[160px]">
      <MultiSelect
        label="Ürün"
        values={selectedProductIds}
        onChange={setSelectedProductIds}
        placeholder="Ürün"
        options={productOptions}
      />
    </div>

    <div className="w-[145px]">
      <MultiSelect
        label="Depo"
        values={selectedWarehouseIds}
        onChange={setSelectedWarehouseIds}
        placeholder="Depo"
        options={warehouseOptions}
      />
    </div>

    <div className="w-[135px]">
      <SelectInput
        label="Stok"
        value={stockStatusFilter}
        onChange={setStockStatusFilter}
        placeholder="Tümü"
        options={[
          {
            label: "Stokta",
            value: "positive",
          },
          {
            label: "Stok Yok",
            value: "zero",
          },
          {
            label: "Negatif Stok",
            value: "negative",
          },
        ]}
      />
    </div>

    <div className="w-[120px]">
      <SelectInput
        label="Durum"
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Tümü"
        options={[
          {
            label: "Aktif",
            value: "active",
          },
          {
            label: "Pasif",
            value: "passive",
          },
        ]}
      />
    </div>

    <div className="w-[140px]">
      <SelectInput
        label="Sırala"
        value={sortBy}
        onChange={setSortBy}
        options={[
          {
            label: "Ürün",
            value: "productName",
          },
          {
            label: "Depo",
            value: "warehouseName",
          },
          {
            label: "Stok",
            value: "quantity",
          },
        ]}
      />
    </div>

    <div className="w-[110px]">
      <SelectInput
        label="Yön"
        value={sortDirection}
        onChange={setSortDirection}
        options={[
          {
            label: "Artan",
            value: "asc",
          },
          {
            label: "Azalan",
            value: "desc",
          },
        ]}
      />
    </div>

    <div className="w-[120px]">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        Arama
      </label>

      <div className="relative">
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={17}
        />

        <input
          className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-9 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="Ara..."
          value={globalSearchText}
          onChange={(event) =>
            setGlobalSearchText(event.target.value)
          }
        />
      </div>
    </div>

    <button
      type="button"
      onClick={() => {
        setSelectedProductIds([]);
        setSelectedWarehouseIds([]);
        setStockStatusFilter("");
        setStatusFilter("");
        setSortBy("productName");
        setSortDirection("asc");
        setGlobalSearchText("");
      }}
      title="Filtreleri temizle"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <X size={16} />
      Temizle
    </button>

    <button
      type="button"
      onClick={() => stocksQuery.refetch()}
      disabled={stocksQuery.isFetching}
      title="Ürün stoklarını yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          stocksQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredStocks.length} ürün stok kaydı bulundu`}
>
  <DataTable
    columns={columns}
    data={filteredStocks}
    loading={
      stocksQuery.isLoading ||
      productsQuery.isLoading ||
      warehousesQuery.isLoading
    }
    emptyText="Ürün stok kaydı bulunamadı."
    totalCount={filteredStocks.length}
  />
</Card>

      <DetailDrawer
        open={Boolean(selectedRecord)}
        title={
          selectedRecord?.productName ??
          "Ürün Stoku"
        }
        subtitle={
          selectedRecord
            ? `${selectedRecord.warehouseName ?? "-"} · ${selectedRecord.warehouseCode ?? "-"}`
            : undefined
        }
        onClose={() => setSelectedRecord(null)}
        widthClassName="w-[620px]"
      >
        {selectedRecord && (
          <div className="space-y-5">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Güncel stok
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${
                      selectedRecord.totalQuantity < 0
                        ? "text-red-700"
                        : selectedRecord.totalQuantity === 0
                          ? "text-amber-700"
                          : "text-emerald-700"
                    }`}
                  >
                    {selectedRecord.totalQuantity.toLocaleString(
                      "tr-TR"
                    )}
                  </p>
                </div>

                <PackageCheck
                  size={38}
                  className="text-violet-600"
                />
              </div>
            </Card>

            <Card title="Stok Bilgileri">
              <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                <DetailItem
                  label="Ürün"
                  value={
                    selectedRecord.productName || "-"
                  }
                />

                <DetailItem
                  label="Ürün Kodu"
                  value={
                    selectedRecord.productCode || "-"
                  }
                />

                <DetailItem
                  label="Depo"
                  value={
                    selectedRecord.warehouseName || "-"
                  }
                />

                <DetailItem
                  label="Depo Kodu"
                  value={
                    selectedRecord.warehouseCode || "-"
                  }
                />

                <div>
                  <p className="text-slate-400">
                    Stok Durumu
                  </p>

                  <div className="mt-1">
                    {getStockBadge(
                      selectedRecord.totalQuantity
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-slate-400">
                    Kayıt Durumu
                  </p>

                  <div className="mt-1">
                    <ActiveStatusBadge
                      isActive={
                        selectedRecord.isActive
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

interface DetailItemProps {
  label: string;
  value: string | number;
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}