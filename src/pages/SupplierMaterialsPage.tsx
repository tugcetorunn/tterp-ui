import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Download,
  Edit,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";

import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";
import MultiSelect from "../components/form/MultiSelect";

import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";

import ActiveStatusBadge from "../components/common/ActiveStatusBadge";
import StatusBadge from "../components/common/StatusBadge";

import { supplierMaterialService } from "../services/supplierMaterialService";
import type { SupplierMaterial } from "../services/supplierMaterialService";

import { supplierService } from "../services/supplierService";
import { materialService } from "../services/materialService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

export default function SupplierMaterialsPage() {
  const queryClient = useQueryClient();

  const currencyParameters =
    useParameterOptions("Currency");

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [selectedRecord, setSelectedRecord] =
    useState<SupplierMaterial | null>(null);

  // Create form
  const [supplierId, setSupplierId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [currency, setCurrency] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [moq, setMoq] = useState("");

  // Filters
  const [selectedSupplierIds, setSelectedSupplierIds] =
    useState<string[]>([]);

  const [selectedMaterialIds, setSelectedMaterialIds] =
    useState<string[]>([]);

  const [selectedCurrencies, setSelectedCurrencies] =
    useState<string[]>([]);

  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const [supplierNameFilter, setSupplierNameFilter] =
    useState("");

  const [materialNameFilter, setMaterialNameFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("materialName");

  const [sortDirection, setSortDirection] =
    useState("asc");

  const supplierMaterialsQuery = useQuery({
    queryKey: ["supplier-materials"],
    queryFn: () => supplierMaterialService.getList(),
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierService.getList,
  });

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: materialService.getList,
  });

  const createMutation = useMutation({
    mutationFn: supplierMaterialService.create,

    onSuccess: async () => {
      resetCreateForm();
      setShowCreateDrawer(false);

      await queryClient.invalidateQueries({
        queryKey: ["supplier-materials"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["materials"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["suppliers"],
      });
    },
  });

  const records = supplierMaterialsQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const materials = materialsQuery.data ?? [];

  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((item) => item.isActive)
        .map((item) => ({
          label: item.name,
          value: String(item.id),
        })),
    [suppliers]
  );

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

  const currencyOptions =
    currencyParameters.options;

  const resetCreateForm = () => {
    setSupplierId("");
    setMaterialId("");
    setCurrency("");
    setListPrice("");
    setUnitPrice("");
    setLeadTimeDays("");
    setMoq("");
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    createMutation.reset();
    resetCreateForm();
  };

  const createSupplierMaterial = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !supplierId ||
      !materialId ||
      !currency ||
      !listPrice ||
      !unitPrice
    ) {
      return;
    }

    createMutation.mutate({
      supplierId: Number(supplierId),
      materialId: Number(materialId),
      currency: Number(currency),
      listPrice: Number(listPrice),
      unitPrice: Number(unitPrice),

      leadTimeDays: leadTimeDays
        ? Number(leadTimeDays)
        : null,

      moq: moq
        ? Number(moq)
        : null,
    });
  };

  const filteredRecords = useMemo(() => {
    let list = [...records];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (item) =>
          item.supplierName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.materialName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.materialCode
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.currencyName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (supplierNameFilter.trim()) {
      const search = supplierNameFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((item) =>
        item.supplierName
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (materialNameFilter.trim()) {
      const search = materialNameFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (item) =>
          item.materialName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          item.materialCode
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (selectedSupplierIds.length > 0) {
      list = list.filter((item) =>
        selectedSupplierIds.includes(
          String(item.supplierId)
        )
      );
    }

    if (selectedMaterialIds.length > 0) {
      list = list.filter((item) =>
        selectedMaterialIds.includes(
          String(item.materialId)
        )
      );
    }

    if (selectedCurrencies.length > 0) {
      list = list.filter((item) =>
        selectedCurrencies.includes(
          String(item.currency)
        )
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

      if (sortBy === "supplierName") {
        result = (
          first.supplierName ?? ""
        ).localeCompare(
          second.supplierName ?? "",
          "tr"
        );
      }

      if (sortBy === "materialName") {
        result = (
          first.materialName ?? ""
        ).localeCompare(
          second.materialName ?? "",
          "tr"
        );
      }

      if (sortBy === "unitPrice") {
        result =
          first.unitPrice - second.unitPrice;
      }

      if (sortBy === "listPrice") {
        result =
          first.listPrice - second.listPrice;
      }

      if (sortBy === "leadTimeDays") {
        result =
          (first.leadTimeDays ?? 0) -
          (second.leadTimeDays ?? 0);
      }

      if (sortBy === "moq") {
        result =
          (first.moq ?? 0) -
          (second.moq ?? 0);
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    records,
    globalSearchText,
    supplierNameFilter,
    materialNameFilter,
    selectedSupplierIds,
    selectedMaterialIds,
    selectedCurrencies,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const getDiscountRate = (
    listPriceValue: number,
    unitPriceValue: number
  ) => {
    if (listPriceValue <= 0) {
      return 0;
    }

    return (
      ((listPriceValue - unitPriceValue) /
        listPriceValue) *
      100
    );
  };

  const columns: DataTableColumn<SupplierMaterial>[] = [
    {
      header: "Malzeme",
      render: (item) => (
        <button
          type="button"
          onClick={() => setSelectedRecord(item)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {item.materialName || "-"}
          </p>

          <p className="text-xs text-slate-400">
            {item.materialCode}
          </p>
        </button>
      ),

      // filter: (
      //   <input
      //     className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Malzeme ara..."
      //     value={materialNameFilter}
      //     onChange={(event) =>
      //       setMaterialNameFilter(
      //         event.target.value
      //       )
      //     }
      //   />
      // ),
    },
    {
      header: "Tedarikçi",
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">
            {item.supplierName || "-"}
          </p>

          <p className="text-xs text-slate-400">
            ID: {item.supplierId}
          </p>
        </div>
      ),

      // filter: (
      //   <input
      //     className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Tedarikçi ara..."
      //     value={supplierNameFilter}
      //     onChange={(event) =>
      //       setSupplierNameFilter(
      //         event.target.value
      //       )
      //     }
      //   />
      // ),
    },
    // {
    //   header: "Para Birimi",
    //   render: (item) =>
    //     item.currencyName || "-",
    //   filter: null,
    // },
    {
      header: "Liste Fiyatı",
      render: (item) => (
        <span className="text-slate-500">
          {item.listPrice.toLocaleString(
            "tr-TR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}{" "}
          {item.currencyName}
        </span>
      ),
      filter: null,
    },
    {
      header: "Birim Fiyat",
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">
            {item.unitPrice.toLocaleString(
              "tr-TR",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}{" "}
            {item.currencyName}
          </p>

          {getDiscountRate(
            item.listPrice,
            item.unitPrice
          ) > 0 && (
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              %
              {getDiscountRate(
                item.listPrice,
                item.unitPrice
              ).toFixed(1)}{" "}
              avantaj
            </p>
          )}
        </div>
      ),
      filter: null,
    },
    {
      header: "Termin",
      render: (item) =>
        item.leadTimeDays != null
          ? `${item.leadTimeDays} gün`
          : "-",
      filter: null,
    },
    {
      header: "MOQ",
      render: (item) =>
        item.moq != null
          ? `${item.moq.toLocaleString(
              "tr-TR"
            )} ${item.materialUnitName}`
          : "-",
      filter: null,
    },
    {
      header: "Durum",
      render: (item) => (
        <ActiveStatusBadge
          isActive={item.isActive}
        />
      ),

      // filter: (
      //   <select
      //     className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     value={statusFilter}
      //     onChange={(event) =>
      //       setStatusFilter(event.target.value)
      //     }
      //   >
      //     <option value="">Tümü</option>
      //     <option value="active">Aktif</option>
      //     <option value="passive">Pasif</option>
      //   </select>
      // ),
    },
    {
      header: "İşlemler",
      render: (item) => (
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            title="Düzenle"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          >
            <Edit size={16} />
          </button>

          <button
            type="button"
            title="Sil"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      filter: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tedarikçi Malzemeleri"
        moduleName="Satın Alma"
        description="Hangi malzemenin hangi tedarikçilerden, hangi fiyat ve şartlarla alınabileceğini yönetin."
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
              Yeni İlişki
            </button>
          </div>
        }
      />

      {supplierMaterialsQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            supplierMaterialsQuery.error
          )}
        </div>
      )}

      {createMutation.isError && (
        <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            createMutation.error
          )}
        </div>
      )}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="w-[160px]">
      <MultiSelect
        label="Tedarikçi"
        values={selectedSupplierIds}
        onChange={setSelectedSupplierIds}
        placeholder="Tedarikçi"
        options={supplierOptions}
      />
    </div>

    <div className="w-[160px]">
      <MultiSelect
        label="Malzeme"
        values={selectedMaterialIds}
        onChange={setSelectedMaterialIds}
        placeholder="Malzeme"
        options={materialOptions}
      />
    </div>

    <div className="w-[145px]">
      <MultiSelect
        label="Para Birimi"
        values={selectedCurrencies}
        onChange={setSelectedCurrencies}
        placeholder="Para birimi"
        options={currencyOptions}
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

    <div className="w-[150px]">
      <SelectInput
        label="Sırala"
        value={sortBy}
        onChange={setSortBy}
        options={[
          {
            label: "Malzeme Adı",
            value: "materialName",
          },
          {
            label: "Tedarikçi Adı",
            value: "supplierName",
          },
          {
            label: "Birim Fiyat",
            value: "unitPrice",
          },
          {
            label: "Liste Fiyatı",
            value: "listPrice",
          },
          {
            label: "Teslim Süresi",
            value: "leadTimeDays",
          },
          {
            label: "MOQ",
            value: "moq",
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
        setSelectedSupplierIds([]);
        setSelectedMaterialIds([]);
        setSelectedCurrencies([]);
        setStatusFilter("");
        setSortBy("materialName");
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
      onClick={() => supplierMaterialsQuery.refetch()}
      disabled={supplierMaterialsQuery.isFetching}
      title="Tedarikçi malzeme ilişkilerini yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          supplierMaterialsQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredRecords.length} tedarikçi–malzeme ilişkisi bulundu`}
>
  <DataTable
    columns={columns}
    data={filteredRecords}
    loading={
      supplierMaterialsQuery.isLoading ||
      suppliersQuery.isLoading ||
      materialsQuery.isLoading ||
      currencyParameters.isLoading
    }
    emptyText="Tedarikçi–malzeme ilişkisi bulunamadı."
    totalCount={filteredRecords.length}
  />
</Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Tedarikçi–Malzeme İlişkisi"
        subtitle="Bir malzemeyi tedarik eden firmayı ve satın alma koşullarını tanımlayın."
        onClose={closeCreateDrawer}
        widthClassName="w-[620px]"
      >
        <form
          onSubmit={createSupplierMaterial}
          className="space-y-5"
        >
          <SelectInput
            label="Tedarikçi"
            value={supplierId}
            onChange={setSupplierId}
            placeholder={
              suppliersQuery.isLoading
                ? "Yükleniyor..."
                : "Tedarikçi seçiniz"
            }
            options={supplierOptions}
          />

          <SelectInput
            label="Malzeme"
            value={materialId}
            onChange={setMaterialId}
            placeholder={
              materialsQuery.isLoading
                ? "Yükleniyor..."
                : "Malzeme seçiniz"
            }
            options={materialOptions}
          />

          <SelectInput
            label="Para Birimi"
            value={currency}
            onChange={setCurrency}
            placeholder={
              currencyParameters.isLoading
                ? "Yükleniyor..."
                : "Para birimi seçiniz"
            }
            options={currencyOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Liste Fiyatı"
              value={listPrice}
              onChange={setListPrice}
              type="number"
              required
            />

            <TextInput
              label="Anlaşmalı Birim Fiyat"
              value={unitPrice}
              onChange={setUnitPrice}
              type="number"
              required
            />

            <TextInput
              label="Teslim Süresi (Gün)"
              value={leadTimeDays}
              onChange={setLeadTimeDays}
              type="number"
            />

            <TextInput
              label="Minimum Sipariş Miktarı"
              value={moq}
              onChange={setMoq}
              type="number"
            />
          </div>

          {listPrice &&
            unitPrice &&
            Number(listPrice) > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Fiyat avantajı
                    </p>

                    <p className="mt-1 text-xl font-bold text-emerald-600">
                      %
                      {getDiscountRate(
                        Number(listPrice),
                        Number(unitPrice)
                      ).toFixed(2)}
                    </p>
                  </div>

                  <StatusBadge
                    text={
                      Number(unitPrice) <=
                      Number(listPrice)
                        ? "Avantajlı"
                        : "Liste fiyatından yüksek"
                    }
                    color={
                      Number(unitPrice) <=
                      Number(listPrice)
                        ? "success"
                        : "danger"
                    }
                  />
                </div>
              </Card>
            )}

          <button
            disabled={createMutation.isPending}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending
              ? "Kaydediliyor..."
              : "İlişkiyi Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedRecord)}
        title={
          selectedRecord?.materialName ??
          "Tedarikçi Malzemesi"
        }
        subtitle={
          selectedRecord
            ? `${selectedRecord.materialCode} · ${selectedRecord.supplierName ?? "-"}`
            : undefined
        }
        onClose={() =>
          setSelectedRecord(null)
        }
        widthClassName="w-[700px]"
      >
        {selectedRecord && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-5">
                <p className="text-sm text-slate-500">
                  Anlaşmalı Fiyat
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {selectedRecord.unitPrice.toLocaleString(
                    "tr-TR",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}{" "}
                  {selectedRecord.currencyName}
                </p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500">
                  Teslim Süresi
                </p>

                <p className="mt-2 text-xl font-bold text-blue-700">
                  {selectedRecord.leadTimeDays ??
                    "-"}{" "}
                  gün
                </p>
              </Card>

              <Card className="p-5">
                <p className="text-sm text-slate-500">
                  Minimum Sipariş
                </p>

                <p className="mt-2 text-xl font-bold text-violet-700">
                  {selectedRecord.moq ?? "-"}{" "}
                  {selectedRecord.materialUnitName}
                </p>
              </Card>
            </div>

            <Card title="İlişki Bilgileri">
              <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                <DetailItem
                  label="Malzeme"
                  value={
                    selectedRecord.materialName ||
                    "-"
                  }
                />

                <DetailItem
                  label="Malzeme Kodu"
                  value={
                    selectedRecord.materialCode
                  }
                />

                <DetailItem
                  label="Tedarikçi"
                  value={
                    selectedRecord.supplierName ||
                    "-"
                  }
                />

                <DetailItem
                  label="Para Birimi"
                  value={
                    selectedRecord.currencyName
                  }
                />

                <DetailItem
                  label="Liste Fiyatı"
                  value={`${selectedRecord.listPrice.toLocaleString(
                    "tr-TR",
                    {
                      minimumFractionDigits: 2,
                    }
                  )} ${selectedRecord.currencyName}`}
                />

                <DetailItem
                  label="Birim Fiyat"
                  value={`${selectedRecord.unitPrice.toLocaleString(
                    "tr-TR",
                    {
                      minimumFractionDigits: 2,
                    }
                  )} ${selectedRecord.currencyName}`}
                />

                <DetailItem
                  label="Teslim Süresi"
                  value={
                    selectedRecord.leadTimeDays !=
                    null
                      ? `${selectedRecord.leadTimeDays} gün`
                      : "-"
                  }
                />

                <DetailItem
                  label="MOQ"
                  value={
                    selectedRecord.moq != null
                      ? `${selectedRecord.moq} ${selectedRecord.materialUnitName}`
                      : "-"
                  }
                />

                <div>
                  <p className="text-slate-400">
                    Durum
                  </p>

                  <div className="mt-1">
                    <ActiveStatusBadge
                      isActive={
                        selectedRecord.isActive
                      }
                    />
                  </div>
                </div>

                <div>
                  <p className="text-slate-400">
                    Fiyat Avantajı
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      text={`%${getDiscountRate(
                        selectedRecord.listPrice,
                        selectedRecord.unitPrice
                      ).toFixed(2)}`}
                      color="success"
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
      <p className="text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}