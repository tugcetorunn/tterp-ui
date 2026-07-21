import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";

import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";

import SelectInput from "../components/form/SelectInput";
import MultiSelect from "../components/form/MultiSelect";
import TextInput from "../components/form/TextInput";

import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";

import ActiveStatusBadge from "../components/common/ActiveStatusBadge";
import StatusBadge from "../components/common/StatusBadge";

import {
  productWarehouseService,
  type ProductWarehouseMovement,
} from "../services/productWarehouseService";

import { productService } from "../services/productService";
import { warehouseService } from "../services/warehouseService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

export default function ProductStockMovementsPage() {
  const queryClient = useQueryClient();

  const reasonParameters = useParameterOptions(
    "ReasonForEntryOrExit"
  );

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [selectedRecord, setSelectedRecord] =
    useState<ProductWarehouseMovement | null>(null);

  // Create
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [quantity, setQuantity] = useState("");

  // Filters
  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>([]);

  const [selectedWarehouseIds, setSelectedWarehouseIds] =
    useState<string[]>([]);

  const [selectedReasonCodes, setSelectedReasonCodes] =
    useState<string[]>([]);

  const [movementTypeFilter, setMovementTypeFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const [sortBy, setSortBy] =
    useState("productName");

  const [sortDirection, setSortDirection] =
    useState("asc");

  const movementsQuery = useQuery({
    queryKey: ["product-stock-movements"],
    queryFn: () => productWarehouseService.getList(),
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productService.getList,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const createMutation = useMutation({
    mutationFn: productWarehouseService.create,

    onSuccess: async () => {
      closeCreateDrawer();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["product-stock-movements"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["product-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["warehouses"],
        }),
      ]);
    },
  });

  const movements = movementsQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const productOptions = useMemo(
    () =>
      products
        .filter((product) => product.isActive)
        .map((product) => ({
          label: `${product.name} (${product.code})`,
          value: String(product.id),
        })),
    [products]
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses
        .filter((warehouse) => warehouse.isActive)
        .map((warehouse) => ({
          label: `${warehouse.name} (${warehouse.code})`,
          value: String(warehouse.id),
        })),
    [warehouses]
  );

  const reasonOptions = reasonParameters.options;

  const resetCreateForm = () => {
    setProductId("");
    setWarehouseId("");
    setReasonCode("");
    setQuantity("");
    createMutation.reset();
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    resetCreateForm();
  };

  const getReason = (
    record: ProductWarehouseMovement
  ) => {
    if (record.reasonForEntryOrExitName) {
      return {
        paramValue:
          record.reasonForEntryOrExitName,
        badgeColor: null,
      };
    }

    return reasonParameters.getByCode(
      record.reasonForEntryOrExit
    );
  };

  const submitMovement = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !productId ||
      !warehouseId ||
      !reasonCode ||
      !quantity
    ) {
      return;
    }

    const absoluteQuantity = Math.abs(
      Number(quantity)
    );

    const selectedReason =
      reasonParameters.getByCode(reasonCode);

    const reasonShortCode =
      selectedReason?.shortCode
        ?.trim()
        .toLocaleLowerCase("tr-TR");

    const isExit =
      reasonShortCode === "exit";

    createMutation.mutate({
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      reasonForEntryOrExit: Number(reasonCode),
      quantity: isExit
        ? -absoluteQuantity
        : absoluteQuantity,
    });
  };

  const filteredMovements = useMemo(() => {
    let list = [...movements];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (item) =>
          item.productName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.warehouseName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.reasonForEntryOrExitName
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

    if (selectedReasonCodes.length > 0) {
      list = list.filter((item) =>
        selectedReasonCodes.includes(
          String(item.reasonForEntryOrExit)
        )
      );
    }

    if (movementTypeFilter === "entry") {
      list = list.filter(
        (item) => item.quantity > 0
      );
    }

    if (movementTypeFilter === "exit") {
      list = list.filter(
        (item) => item.quantity < 0
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
          first.quantity - second.quantity;
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    movements,
    globalSearchText,
    selectedProductIds,
    selectedWarehouseIds,
    selectedReasonCodes,
    movementTypeFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const columns: DataTableColumn<ProductWarehouseMovement>[] =
    [
      {
        header: "Ürün",

        render: (item) => (
          <button
            type="button"
            onClick={() =>
              setSelectedRecord(item)
            }
            className="text-left"
          >
            <p className="font-semibold text-slate-800 hover:text-indigo-600">
              {item.productName || "-"}
            </p>

            <p className="text-xs text-slate-400">
              ID: {item.productId}
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
              ID: {item.warehouseId}
            </p>
          </div>
        ),

        filter: null,
      },
      {
        header: "Hareket",

        render: (item) => (
          <StatusBadge
            text={
              item.quantity >= 0
                ? "Giriş"
                : "Çıkış"
            }
            color={
              item.quantity >= 0
                ? "success"
                : "danger"
            }
          />
        ),

        filter: null,
      },
      {
        header: "Miktar",

        render: (item) => (
          <div className="flex items-center gap-2">
            {item.quantity >= 0 ? (
              <ArrowUpRight
                size={18}
                className="text-emerald-600"
              />
            ) : (
              <ArrowDownRight
                size={18}
                className="text-red-600"
              />
            )}

            <span
              className={`font-bold ${
                item.quantity >= 0
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {item.quantity > 0 ? "+" : ""}
              {item.quantity.toLocaleString(
                "tr-TR"
              )}
            </span>
          </div>
        ),

        filter: null,
      },
      {
        header: "Neden",

        render: (item) => {
          const reason = getReason(item);

          return reason ? (
            <StatusBadge
              text={reason.paramValue}
              color={reason.badgeColor}
            />
          ) : (
            "-"
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
            onClick={() =>
              setSelectedRecord(item)
            }
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
        title="Ürün Stok Hareketleri"
        moduleName="Stok Yönetimi"
        description="Ürünlerin depo giriş ve çıkış hareketlerini görüntüleyin ve yönetin."
        rightContent={
          <div className="flex items-center gap-3">
            <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50">
              <Download size={18} />
              Dışa Aktar
            </button>

            <button
              type="button"
              onClick={() =>
                setShowCreateDrawer(true)
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Stok Hareketi
            </button>
          </div>
        }
      />

      {movementsQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            movementsQuery.error
          )}
        </div>
      )}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="w-[150px]">
      <MultiSelect
        label="Ürün"
        values={selectedProductIds}
        onChange={setSelectedProductIds}
        placeholder="Ürün"
        options={productOptions}
      />
    </div>

    <div className="w-[140px]">
      <MultiSelect
        label="Depo"
        values={selectedWarehouseIds}
        onChange={setSelectedWarehouseIds}
        placeholder="Depo"
        options={warehouseOptions}
      />
    </div>

    <div className="w-[155px]">
      <MultiSelect
        label="Hareket Nedeni"
        values={selectedReasonCodes}
        onChange={setSelectedReasonCodes}
        placeholder="Neden"
        options={reasonOptions}
      />
    </div>

    <div className="w-[130px]">
      <SelectInput
        label="Hareket Tipi"
        value={movementTypeFilter}
        onChange={setMovementTypeFilter}
        placeholder="Tümü"
        options={[
          {
            label: "Giriş",
            value: "entry",
          },
          {
            label: "Çıkış",
            value: "exit",
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

    <div className="w-[135px]">
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
            label: "Miktar",
            value: "quantity",
          },
        ]}
      />
    </div>

    <div className="w-[105px]">
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
        setSelectedReasonCodes([]);
        setMovementTypeFilter("");
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
      onClick={() => movementsQuery.refetch()}
      disabled={movementsQuery.isFetching}
      title="Ürün stok hareketlerini yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          movementsQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredMovements.length} ürün stok hareketi bulundu`}
>
  <DataTable
    columns={columns}
    data={filteredMovements}
    loading={
      movementsQuery.isLoading ||
      productsQuery.isLoading ||
      warehousesQuery.isLoading ||
      reasonParameters.isLoading
    }
    emptyText="Ürün stok hareketi bulunamadı."
    totalCount={filteredMovements.length}
  />
</Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Ürün Stok Hareketi"
        subtitle="Depoya ürün girişi veya çıkışı oluşturun."
        onClose={closeCreateDrawer}
        widthClassName="w-[580px]"
      >
        {createMutation.isError && (
          <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {getErrorMessage(
              createMutation.error
            )}
          </div>
        )}

        <form
          onSubmit={submitMovement}
          className="space-y-5"
        >
          <SelectInput
            label="Ürün"
            value={productId}
            onChange={setProductId}
            placeholder="Ürün seçiniz"
            options={productOptions}
          />

          <SelectInput
            label="Depo"
            value={warehouseId}
            onChange={setWarehouseId}
            placeholder="Depo seçiniz"
            options={warehouseOptions}
          />

          <SelectInput
            label="Hareket Nedeni"
            value={reasonCode}
            onChange={setReasonCode}
            placeholder="Hareket nedeni seçiniz"
            options={reasonOptions}
          />

          <TextInput
            label="Miktar"
            value={quantity}
            onChange={setQuantity}
            type="number"
            required
          />

          <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-700">
            Miktarı pozitif gir. Seçilen parametrenin
            ShortCode değeri <strong>exit</strong> ise
            miktar çıkış olarak negatif gönderilir.
          </p>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending
              ? "Kaydediliyor..."
              : "Stok Hareketini Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedRecord)}
        title={
          selectedRecord?.productName ??
          "Ürün Stok Hareketi"
        }
        subtitle={
          selectedRecord
            ? selectedRecord.warehouseName ?? "-"
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
                    Hareket miktarı
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${
                      selectedRecord.quantity >= 0
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {selectedRecord.quantity > 0
                      ? "+"
                      : ""}
                    {selectedRecord.quantity.toLocaleString(
                      "tr-TR"
                    )}
                  </p>
                </div>

                {selectedRecord.quantity >= 0 ? (
                  <ArrowUpRight
                    size={36}
                    className="text-emerald-600"
                  />
                ) : (
                  <ArrowDownRight
                    size={36}
                    className="text-red-600"
                  />
                )}
              </div>
            </Card>

            <Card title="Hareket Bilgileri">
              <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                <DetailItem
                  label="Ürün"
                  value={
                    selectedRecord.productName || "-"
                  }
                />

                <DetailItem
                  label="Depo"
                  value={
                    selectedRecord.warehouseName || "-"
                  }
                />

                <DetailItem
                  label="Hareket Tipi"
                  value={
                    selectedRecord.quantity >= 0
                      ? "Giriş"
                      : "Çıkış"
                  }
                />

                <DetailItem
                  label="Hareket Nedeni"
                  value={
                    getReason(selectedRecord)
                      ?.paramValue ?? "-"
                  }
                />

                <DetailItem
                  label="Miktar"
                  value={
                    selectedRecord.quantity
                  }
                />

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