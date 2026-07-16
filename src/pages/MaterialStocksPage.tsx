import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  RefreshCcw,
  Search,
  Warehouse,
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
  materialWarehouseService,
  type MaterialStock,
} from "../services/materialWarehouseService";

import { materialService } from "../services/materialService";
import { warehouseService } from "../services/warehouseService";

import { getErrorMessage } from "../utils/apiResponse";

export default function MaterialStocksPage() {
  const [selectedRecord, setSelectedRecord] =
    useState<MaterialStock | null>(null);

  const [selectedMaterialIds, setSelectedMaterialIds] =
    useState<string[]>([]);

  const [selectedWarehouseIds, setSelectedWarehouseIds] =
    useState<string[]>([]);

  const [selectedUnits, setSelectedUnits] =
    useState<string[]>([]);

  const [stockStatusFilter, setStockStatusFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("materialName");

  const [sortDirection, setSortDirection] =
    useState("asc");

  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const stocksQuery = useQuery({
    queryKey: ["material-stocks"],
    queryFn: () =>
      materialWarehouseService.getStockList(),
  });

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: materialService.getList,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const stocks = stocksQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const materialOptions = useMemo(
    () =>
      materials.map((item) => ({
        label: `${item.name} (${item.code})`,
        value: String(item.id),
      })),
    [materials]
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((item) => ({
        label: `${item.name} (${item.code})`,
        value: String(item.id),
      })),
    [warehouses]
  );

  const unitOptions = useMemo(() => {
  const unitMap = new Map<string, string>();

  stocks.forEach((stock) => {
    if (
      stock.materialUnit != null &&
      stock.materialUnitName?.trim()
    ) {
      unitMap.set(
        String(stock.materialUnit),
        stock.materialUnitName.trim()
      );
    }
  });

  return Array.from(
      unitMap.entries()
    ).map(([unitCode, unitName]) => ({
      label: unitName,
      value: unitCode,
    }));
  }, [stocks]);

  const clearFilters = () => {
    setSelectedMaterialIds([]);
    setSelectedWarehouseIds([]);
    setSelectedUnits([]);
    setStockStatusFilter("");
    setStatusFilter("");
    setSortBy("materialName");
    setSortDirection("asc");
    setGlobalSearchText("");
  };

  const filteredStocks = useMemo(() => {
    let list = [...stocks];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (item) =>
          item.materialName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.materialCode
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

    if (selectedMaterialIds.length > 0) {
      list = list.filter((item) =>
        selectedMaterialIds.includes(
          String(item.materialId)
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

    if (selectedUnits.length > 0) {
      list = list.filter((item) =>
        selectedUnits.includes(String(item.materialUnit))
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

      if (sortBy === "materialName") {
        result = first.materialName.localeCompare(
          second.materialName,
          "tr"
        );
      }

      if (sortBy === "warehouseName") {
        result = first.warehouseName.localeCompare(
          second.warehouseName,
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
    selectedMaterialIds,
    selectedWarehouseIds,
    selectedUnits,
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

  const columns: DataTableColumn<MaterialStock>[] = [
    {
      header: "Malzeme",
      render: (item) => (
        <button
          type="button"
          onClick={() => setSelectedRecord(item)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {item.materialName}
          </p>

          <p className="text-xs text-slate-400">
            {item.materialCode}
          </p>
        </button>
      ),
      filter: null,
    },
    {
      header: "Birim",
      render: (item) =>
        item.materialUnitName || "-",
      filter: null,
    },
    {
      header: "Depo",
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">
            {item.warehouseName}
          </p>

          <p className="text-xs text-slate-400">
            {item.warehouseCode}
          </p>
        </div>
      ),
      filter: null,
    },
    {
  header: "Stok",
  render: (stock) => (
    <div className="text-right">
      <p className="font-bold text-slate-900">
        {stock.totalQuantity.toLocaleString("tr-TR")}
      </p>

      <p className="text-xs text-slate-400">
        {stock.materialUnitName}
      </p>
    </div>
  ),
  filter: null,
},
{
  header: "Rezerve",
  render: (stock) => (
    <div className="text-right">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
          stock.reservedQuantity > 0
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-50 text-slate-500"
        }`}
      >
        {stock.reservedQuantity.toLocaleString("tr-TR")}
      </span>

      <p className="mt-1 text-xs text-slate-400">
        {stock.materialUnitName}
      </p>
    </div>
  ),
  filter: null,
},
{
  header: "Kullanılabilir",
  render: (stock) => {
    const isLow =
      stock.availableQuantity <= 0 ||
      stock.availableQuantity <
        stock.totalQuantity * 0.2;

    return (
      <div className="text-right">
        <p
          className={`font-bold ${
            isLow
              ? "text-red-600"
              : "text-emerald-700"
          }`}
        >
          {stock.availableQuantity.toLocaleString(
            "tr-TR"
          )}
        </p>

        <p className="text-xs text-slate-400">
          {stock.materialUnitName}
        </p>
      </div>
    );
  },
  filter: null,
},
{
  header: "Stok Durumu",
  render: (stock) => {
    if (stock.availableQuantity <= 0) {
      return (
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          Kullanılabilir stok yok
        </span>
      );
    }

    if (
      stock.availableQuantity <
      stock.totalQuantity * 0.2
    ) {
      return (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Kritik stok
        </span>
      );
    }

    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Yeterli
      </span>
    );
  },
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
        title="Malzeme Stokları"
        moduleName="Ürün & Stok"
        description="Malzemelerin depo bazındaki güncel stok durumlarını görüntüleyin."
        rightContent={
          <div className="flex items-center gap-3">
            <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50">
              <Download size={18} />
              Dışa Aktar
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <X size={18} />
              Filtreleri Temizle
            </button>
          </div>
        }
      />

      {stocksQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(stocksQuery.error)}
        </div>
      )}

      <Card className="mb-5 p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <MultiSelect
              label="Malzemeler"
              values={selectedMaterialIds}
              onChange={setSelectedMaterialIds}
              placeholder="Malzeme seçin"
              options={materialOptions}
            />

            <MultiSelect
              label="Depolar"
              values={selectedWarehouseIds}
              onChange={setSelectedWarehouseIds}
              placeholder="Depo seçin"
              options={warehouseOptions}
            />

            <MultiSelect
              label="Birimler"
              values={selectedUnits}
              onChange={setSelectedUnits}
              placeholder="Birim seçin"
              options={unitOptions}
            />
          </div>

          <div className="grid grid-cols-5 gap-4">
            <SelectInput
              label="Stok Durumu"
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

            <SelectInput
              label="Sırala"
              value={sortBy}
              onChange={setSortBy}
              options={[
                {
                  label: "Malzeme",
                  value: "materialName",
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

            <SelectInput
              label="Sıralama"
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

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Arama
              </label>

              <div className="relative">
                <Search
                  className="absolute right-3 top-3 text-slate-400"
                  size={18}
                />

                <input
                  className="h-11 w-full rounded-xl border border-slate-200 pl-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Malzeme, kod, depo..."
                  value={globalSearchText}
                  onChange={(event) =>
                    setGlobalSearchText(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredStocks.length} stok kaydı bulundu`}
        headerRight={
          <button
            type="button"
            onClick={() => stocksQuery.refetch()}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Yenile
          </button>
        }
      >
        <DataTable
          columns={columns}
          data={filteredStocks}
          loading={
            stocksQuery.isLoading ||
            materialsQuery.isLoading ||
            warehousesQuery.isLoading
          }
          emptyText="Malzeme stok kaydı bulunamadı."
          totalCount={filteredStocks.length}
        />
      </Card>

      <DetailDrawer
        open={Boolean(selectedRecord)}
        title={
          selectedRecord?.materialName ??
          "Malzeme Stoku"
        }
        subtitle={
          selectedRecord
            ? `${selectedRecord.warehouseName} · ${selectedRecord.warehouseCode}`
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
                    )}{" "}
                    {selectedRecord.materialUnitName ?? "-"}
                  </p>
                </div>

                <Warehouse
                  size={38}
                  className="text-blue-600"
                />
              </div>
            </Card>

            <Card title="Stok Bilgileri">
              <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                <DetailItem
                  label="Malzeme"
                  value={selectedRecord.materialName}
                />

                <DetailItem
                  label="Malzeme Kodu"
                  value={selectedRecord.materialCode}
                />

                <DetailItem
                  label="Birim"
                  value={selectedRecord.materialUnitName ?? "-"}
                />

                <DetailItem
                  label="Depo"
                  value={selectedRecord.warehouseName}
                />

                <DetailItem
                  label="Depo Kodu"
                  value={selectedRecord.warehouseCode}
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