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
  CalendarClock,
  Download,
  Eye,
  LockKeyhole,
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

import {
  materialWarehouseService,
  type MaterialStockTimelineItem,
} from "../services/materialWarehouseService";

import { materialService } from "../services/materialService";
import { warehouseService } from "../services/warehouseService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

type MovementTypeFilter =
  | ""
  | "entry"
  | "exit"
  | "reservation";

export default function MaterialWarehousesPage() {
  const queryClient = useQueryClient();

  const reasonParameters = useParameterOptions(
    "ReasonForEntryOrExit",
    1
  );

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [selectedRecord, setSelectedRecord] =
    useState<MaterialStockTimelineItem | null>(
      null
    );

  // Create form
  const [materialId, setMaterialId] =
    useState("");

  const [warehouseId, setWarehouseId] =
    useState("");

  const [reasonCode, setReasonCode] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  // Filters
  const [
    selectedMaterialIds,
    setSelectedMaterialIds,
  ] = useState<string[]>([]);

  const [
    selectedWarehouseIds,
    setSelectedWarehouseIds,
  ] = useState<string[]>([]);

  const [
    selectedReasonCodes,
    setSelectedReasonCodes,
  ] = useState<string[]>([]);

  const [
    movementTypeFilter,
    setMovementTypeFilter,
  ] = useState<MovementTypeFilter>("");

  const [
    reservationStatusFilter,
    setReservationStatusFilter,
  ] = useState("");

  const [
    globalSearchText,
    setGlobalSearchText,
  ] = useState("");

  const [sortBy, setSortBy] =
    useState("transactionDate");

  const [sortDirection, setSortDirection] =
    useState("desc");

  const timelineQuery = useQuery({
    queryKey: ["material-stock-timeline"],
    queryFn: () =>
      materialWarehouseService.getTimeline(),
  });

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: materialService.getList,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const createMutation = useMutation({
    mutationFn: materialWarehouseService.create,

    onSuccess: async () => {
      resetCreateForm();
      setShowCreateDrawer(false);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "material-stock-timeline",
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-warehouses"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["materials"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["warehouses"],
        }),
      ]);
    },
  });

  const records = timelineQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const materialOptions = useMemo(
    () =>
      materials
        .filter((item) => item.isActive)
        .map((item) => ({
          label: `${item.name} (${item.code})`,
          value: String(item.id),
        })),
    [materials]
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses
        .filter((item) => item.isActive)
        .map((item) => ({
          label: `${item.name} (${item.code})`,
          value: String(item.id),
        })),
    [warehouses]
  );

  const reasonOptions =
    reasonParameters.options;

  const resetCreateForm = () => {
    setMaterialId("");
    setWarehouseId("");
    setReasonCode("");
    setQuantity("");
    createMutation.reset();
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    resetCreateForm();
  };

  const submitMovement = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !materialId ||
      !warehouseId ||
      !reasonCode ||
      !quantity
    ) {
      return;
    }

    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return;
    }

    const selectedReason =
      reasonParameters.getByCode(reasonCode);

    const shortCode =
      selectedReason?.shortCode
        ?.trim()
        .toLocaleUpperCase("tr-TR") ?? "";

    const valueText =
      selectedReason?.paramValue
        ?.trim()
        .toLocaleLowerCase("tr-TR") ?? "";

    const exitShortCodes = new Set([
      "HMDCKS",
      "HMDKYP",
      "MNLCKS",
    ]);

    const isExit =
      exitShortCodes.has(shortCode) ||
      valueText.includes("çıkış") ||
      valueText.includes("kayıp");

    createMutation.mutate({
      materialId: Number(materialId),
      warehouseId: Number(warehouseId),
      reasonForEntryOrExit:
        Number(reasonCode),
      quantity: isExit
        ? -Math.abs(parsedQuantity)
        : Math.abs(parsedQuantity),
    });
  };

  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((item) => {
        const transactionText =
          item.isReservation
            ? "rezervasyon"
            : item.reasonName ?? "";

        return (
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
            .includes(search) ||
          transactionText
            .toLocaleLowerCase("tr-TR")
            .includes(search) ||
          String(item.productionId ?? "").includes(
            search
          )
        );
      });
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

    if (selectedReasonCodes.length > 0) {
      list = list.filter(
        (item) =>
          !item.isReservation &&
          item.reasonCode != null &&
          selectedReasonCodes.includes(
            String(item.reasonCode)
          )
      );
    }

    if (movementTypeFilter === "entry") {
      list = list.filter(
        (item) =>
          !item.isReservation &&
          item.quantity > 0
      );
    }

    if (movementTypeFilter === "exit") {
      list = list.filter(
        (item) =>
          !item.isReservation &&
          item.quantity < 0
      );
    }

    if (
      movementTypeFilter === "reservation"
    ) {
      list = list.filter(
        (item) => item.isReservation
      );
    }

    if (
      reservationStatusFilter === "active"
    ) {
      list = list.filter(
        (item) =>
          item.isReservation &&
          !item.isReleased
      );
    }

    if (
      reservationStatusFilter === "released"
    ) {
      list = list.filter(
        (item) =>
          item.isReservation &&
          item.isReleased
      );
    }

    list.sort((first, second) => {
      let result = 0;

      if (sortBy === "transactionDate") {
        result =
          new Date(
            first.transactionDate
          ).getTime() -
          new Date(
            second.transactionDate
          ).getTime();
      }

      if (sortBy === "materialName") {
        result = (
          first.materialName ?? ""
        ).localeCompare(
          second.materialName ?? "",
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
    records,
    globalSearchText,
    selectedMaterialIds,
    selectedWarehouseIds,
    selectedReasonCodes,
    movementTypeFilter,
    reservationStatusFilter,
    sortBy,
    sortDirection,
  ]);

  const columns: DataTableColumn<MaterialStockTimelineItem>[] =
    [
      {
        header: "Tarih",
        render: (item) => (
          <div>
            <p className="font-medium text-slate-800">
              {formatDate(
                item.transactionDate
              )}
            </p>

            <p className="text-xs text-slate-400">
              {formatTime(
                item.transactionDate
              )}
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "Malzeme",
        render: (item) => (
          <button
            type="button"
            onClick={() =>
              setSelectedRecord(item)
            }
            className="text-left"
          >
            <p className="font-semibold text-slate-800 hover:text-indigo-600">
              {item.materialName ?? "-"}
            </p>

            <p className="text-xs text-slate-400">
              {item.materialCode ?? "-"}
            </p>
          </button>
        ),
        filter: null,
      },
      {
        header: "Depo",
        render: (item) => (
          <div>
            <p className="font-medium text-slate-800">
              {item.warehouseName ?? "-"}
            </p>

            <p className="text-xs text-slate-400">
              {item.warehouseCode ?? "-"}
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "İşlem",
        render: (item) => {
          if (item.isReservation) {
            return (
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <LockKeyhole size={13} />
                  Rezervasyon
                </span>

                {item.productionId != null && (
                  <p className="mt-1 text-xs text-slate-400">
                    Üretim #
                    {item.productionId}
                  </p>
                )}
              </div>
            );
          }

          return (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {item.reasonName ??
                "Stok Hareketi"}
            </span>
          );
        },
        filter: null,
      },
      {
        header: "Miktar",
        render: (item) => {
          if (item.isReservation) {
            return (
              <p className="text-right font-bold text-amber-700">
                {item.quantity.toLocaleString(
                  "tr-TR"
                )}
              </p>
            );
          }

          const isEntry = item.quantity > 0;

          return (
            <p
              className={`text-right font-bold ${
                isEntry
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {isEntry ? "+" : ""}
              {item.quantity.toLocaleString(
                "tr-TR"
              )}
            </p>
          );
        },
        filter: null,
      },
      {
        header: "Durum",
        render: (item) => {
          if (!item.isReservation) {
            return (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Gerçekleşti
              </span>
            );
          }

          return item.isReleased ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Kapandı
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Aktif rezervasyon
            </span>
          );
        },
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
        title="Malzeme Stok Hareketleri"
        moduleName="Ürün & Stok"
        description="Fiziksel stok hareketlerini ve üretim rezervasyonlarını kronolojik olarak görüntüleyin."
        rightContent={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50"
            >
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

      {timelineQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            timelineQuery.error
          )}
        </div>
      )}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="w-[150px]">
      <MultiSelect
        label="Malzeme"
        values={selectedMaterialIds}
        onChange={setSelectedMaterialIds}
        placeholder="Malzeme"
        options={materialOptions}
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
        label="Kayıt Tipi"
        value={movementTypeFilter}
        onChange={(value) =>
          setMovementTypeFilter(
            value as MovementTypeFilter
          )
        }
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
          {
            label: "Rezervasyon",
            value: "reservation",
          },
        ]}
      />
    </div>

    <div className="w-[145px]">
      <SelectInput
        label="Rezervasyon"
        value={reservationStatusFilter}
        onChange={setReservationStatusFilter}
        placeholder="Tümü"
        options={[
          {
            label: "Aktif",
            value: "active",
          },
          {
            label: "Kapandı",
            value: "released",
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
            label: "Tarih",
            value: "transactionDate",
          },
          {
            label: "Malzeme",
            value: "materialName",
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
        setSelectedMaterialIds([]);
        setSelectedWarehouseIds([]);
        setSelectedReasonCodes([]);
        setMovementTypeFilter("");
        setReservationStatusFilter("");
        setSortBy("transactionDate");
        setSortDirection("desc");
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
      onClick={() => timelineQuery.refetch()}
      disabled={timelineQuery.isFetching}
      title="Stok hareketlerini yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          timelineQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredRecords.length} kayıt bulundu`}
>
  <DataTable<MaterialStockTimelineItem>
    columns={columns}
    data={filteredRecords}
    loading={
      timelineQuery.isLoading ||
      materialsQuery.isLoading ||
      warehousesQuery.isLoading ||
      reasonParameters.isLoading
    }
    emptyText="Stok hareketi veya rezervasyon bulunamadı."
    totalCount={filteredRecords.length}
  />
</Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Malzeme Stok Hareketi"
        subtitle="Manuel malzeme giriş veya çıkış hareketi oluşturun."
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
            label="Malzeme"
            value={materialId}
            onChange={setMaterialId}
            placeholder="Malzeme seçiniz"
            options={materialOptions}
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
            Miktarı pozitif girin. Hammadde
            çıkışı, hammadde kaybı veya manuel
            çıkış seçildiğinde miktar otomatik
            olarak negatif gönderilir.
          </p>

          <button
            type="submit"
            disabled={
              createMutation.isPending
            }
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
          selectedRecord?.materialName ??
          "Stok Kaydı"
        }
        subtitle={
          selectedRecord
            ? `${selectedRecord.warehouseName ?? "-"} · ${selectedRecord.warehouseCode ?? "-"}`
            : undefined
        }
        onClose={() =>
          setSelectedRecord(null)
        }
        widthClassName="w-[650px]"
      >
        {selectedRecord && (
          <div className="space-y-5">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {selectedRecord.isReservation
                      ? "Rezerve edilen miktar"
                      : "Hareket miktarı"}
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${
                      selectedRecord.isReservation
                        ? "text-amber-700"
                        : selectedRecord.quantity >= 0
                          ? "text-emerald-700"
                          : "text-red-700"
                    }`}
                  >
                    {!selectedRecord.isReservation &&
                    selectedRecord.quantity > 0
                      ? "+"
                      : ""}

                    {selectedRecord.quantity.toLocaleString(
                      "tr-TR"
                    )}
                  </p>
                </div>

                {selectedRecord.isReservation ? (
                  <LockKeyhole
                    size={38}
                    className="text-amber-600"
                  />
                ) : selectedRecord.quantity >=
                  0 ? (
                  <ArrowUpRight
                    size={38}
                    className="text-emerald-600"
                  />
                ) : (
                  <ArrowDownRight
                    size={38}
                    className="text-red-600"
                  />
                )}
              </div>
            </Card>

            <Card title="Kayıt Bilgileri">
              <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                <DetailItem
                  label="Malzeme"
                  value={
                    selectedRecord.materialName ??
                    "-"
                  }
                />

                <DetailItem
                  label="Malzeme Kodu"
                  value={
                    selectedRecord.materialCode ??
                    "-"
                  }
                />

                <DetailItem
                  label="Depo"
                  value={
                    selectedRecord.warehouseName ??
                    "-"
                  }
                />

                <DetailItem
                  label="Depo Kodu"
                  value={
                    selectedRecord.warehouseCode ??
                    "-"
                  }
                />

                <DetailItem
                  label="Kayıt Tipi"
                  value={
                    selectedRecord.isReservation
                      ? "Rezervasyon"
                      : selectedRecord.quantity >= 0
                        ? "Stok Girişi"
                        : "Stok Çıkışı"
                  }
                />

                <DetailItem
                  label="İşlem Nedeni"
                  value={
                    selectedRecord.isReservation
                      ? "Üretim rezervasyonu"
                      : selectedRecord.reasonName ??
                        "-"
                  }
                />

                <DetailItem
                  label="Tarih"
                  value={formatDateTime(
                    selectedRecord.transactionDate
                  )}
                />

                <DetailItem
                  label="Durum"
                  value={
                    selectedRecord.isReservation
                      ? selectedRecord.isReleased
                        ? "Kapandı"
                        : "Aktif rezervasyon"
                      : "Gerçekleşti"
                  }
                />

                {selectedRecord.productionId !=
                  null && (
                  <DetailItem
                    label="Üretim Kaydı"
                    value={`#${selectedRecord.productionId}`}
                  />
                )}

                <DetailItem
                  label="Kayıt Numarası"
                  value={`${selectedRecord.recordType} #${selectedRecord.recordId}`}
                />
              </div>
            </Card>

            {selectedRecord.isReservation && (
              <Card className="p-5">
                <div className="flex gap-3">
                  <CalendarClock
                    size={21}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="font-semibold text-slate-800">
                      Rezervasyon bilgisi
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Bu kayıt fiziksel stok
                      hareketi değildir.
                      Kullanılabilir stok hesabında
                      dikkate alınır ve üretim
                      başladığında fiziksel stok
                      çıkışına dönüşür.
                    </p>
                  </div>
                </div>
              </Card>
            )}
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
      <p className="text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(
    value
  ).toLocaleDateString("tr-TR");
}

function formatTime(value: string) {
  return new Date(
    value
  ).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(
    "tr-TR"
  );
}