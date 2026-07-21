import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Boxes,
  Download,
  Edit,
  Eye,
  MapPin,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";

import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";

import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";

import LocationSelector from "../components/location/LocationSelector";
import LocationFilter from "../components/location/LocationFilter";

import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";
import DrawerTabs from "../components/drawer/DrawerTabs";

import ActiveStatusBadge from "../components/common/ActiveStatusBadge";
import StatusBadge from "../components/common/StatusBadge";

import {
  warehouseService,
  type Warehouse,
} from "../services/warehouseService";

import {
  materialWarehouseService,
  type MaterialStock,
  type MaterialWarehouse,
} from "../services/materialWarehouseService";

import {
  emptyLocationValue,
  type LocationValue,
} from "../types/location";

import { getErrorMessage } from "../utils/apiResponse";

type WarehouseDetailTab =
  | "general"
  | "materialStocks"
  | "materialMovements"
  | "productStocks";

export default function WarehousesPage() {
  const queryClient = useQueryClient();

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [selectedWarehouse, setSelectedWarehouse] =
    useState<Warehouse | null>(null);

  const [activeDetailTab, setActiveDetailTab] =
    useState<WarehouseDetailTab>("general");

  // Create form
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const [location, setLocation] =
    useState<LocationValue>(emptyLocationValue);

  // Filters
  const [locationFilter, setLocationFilter] =
    useState<LocationValue>(emptyLocationValue);

  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const [nameFilter, setNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] =
    useState("asc");

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const materialStocksQuery = useQuery({
    queryKey: [
      "material-stocks",
      "warehouse",
      selectedWarehouse?.id,
    ],

    queryFn: () =>
      materialWarehouseService.getStockList({
        warehouseId: selectedWarehouse!.id,
      }),

    enabled:
      Boolean(selectedWarehouse?.id) &&
      activeDetailTab === "materialStocks",
  });

  const materialMovementsQuery = useQuery({
    queryKey: [
      "material-warehouses",
      "warehouse",
      selectedWarehouse?.id,
    ],

    queryFn: () =>
      materialWarehouseService.getList({
        warehouseId: selectedWarehouse!.id,
      }),

    enabled:
      Boolean(selectedWarehouse?.id) &&
      activeDetailTab === "materialMovements",
  });

  const createMutation = useMutation({
    mutationFn: warehouseService.create,

    onSuccess: async () => {
      closeCreateDrawer();

      await queryClient.invalidateQueries({
        queryKey: ["warehouses"],
      });
    },
  });

  const warehouses = warehousesQuery.data ?? [];

  const resetCreateForm = () => {
    setName("");
    setCode("");
    setAddressLine("");
    setLocation(emptyLocationValue);
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    createMutation.reset();
    resetCreateForm();
  };

  const openDetail = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setActiveDetailTab("general");
  };

  const closeDetail = () => {
    setSelectedWarehouse(null);
    setActiveDetailTab("general");
  };

  const submitWarehouse = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !code.trim() ||
      !addressLine.trim() ||
      !location.countryId ||
      !location.cityId ||
      !location.townId ||
      !location.districtId ||
      !location.neighborhoodId
    ) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      code: code.trim(),

      countryId: Number(location.countryId),
      cityId: Number(location.cityId),
      townId: Number(location.townId),
      districtId: Number(location.districtId),

      neighborhoodId: Number(
        location.neighborhoodId
      ),

      addressLine: addressLine.trim(),
    });
  };

  const filteredWarehouses = useMemo(() => {
    let list = [...warehouses];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (warehouse) =>
          warehouse.name
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.code
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.countryName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.cityName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.townName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.districtName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.neighborhoodName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          warehouse.addressLine
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (nameFilter.trim()) {
      const search = nameFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((warehouse) =>
        warehouse.name
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (codeFilter.trim()) {
      const search = codeFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((warehouse) =>
        warehouse.code
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (locationFilter.countryId) {
      list = list.filter(
        (warehouse) =>
          String(warehouse.countryId) ===
          locationFilter.countryId
      );
    }

    if (locationFilter.cityId) {
      list = list.filter(
        (warehouse) =>
          String(warehouse.cityId) ===
          locationFilter.cityId
      );
    }

    if (locationFilter.townId) {
      list = list.filter(
        (warehouse) =>
          String(warehouse.townId) ===
          locationFilter.townId
      );
    }

    if (locationFilter.districtId) {
      list = list.filter(
        (warehouse) =>
          String(warehouse.districtId) ===
          locationFilter.districtId
      );
    }

    if (locationFilter.neighborhoodId) {
      list = list.filter(
        (warehouse) =>
          String(warehouse.neighborhoodId) ===
          locationFilter.neighborhoodId
      );
    }

    if (statusFilter) {
      list = list.filter((warehouse) =>
        statusFilter === "active"
          ? warehouse.isActive
          : !warehouse.isActive
      );
    }

    list.sort((first, second) => {
      let result = 0;

      if (sortBy === "name") {
        result = first.name.localeCompare(
          second.name,
          "tr"
        );
      }

      if (sortBy === "code") {
        result = first.code.localeCompare(
          second.code,
          "tr"
        );
      }

      if (sortBy === "city") {
        result = (
          first.cityName ?? ""
        ).localeCompare(
          second.cityName ?? "",
          "tr"
        );
      }

      if (sortBy === "town") {
        result = (
          first.townName ?? ""
        ).localeCompare(
          second.townName ?? "",
          "tr"
        );
      }

      if (sortBy === "materialCount") {
        result =
          (first.materialWarehouses?.length ?? 0) -
          (second.materialWarehouses?.length ?? 0);
      }

      if (sortBy === "productCount") {
        result =
          (first.productWarehouses?.length ?? 0) -
          (second.productWarehouses?.length ?? 0);
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    warehouses,
    globalSearchText,
    nameFilter,
    codeFilter,
    locationFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const columns: DataTableColumn<Warehouse>[] = [
    {
      header: "Depo",

      render: (warehouse) => (
        <button
          type="button"
          onClick={() => openDetail(warehouse)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {warehouse.name}
          </p>

          <p className="text-xs text-slate-400">
            ID: {warehouse.id}
          </p>
        </button>
      ),

      // filter: (
      //   <input
      //     className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Depo ara..."
      //     value={nameFilter}
      //     onChange={(event) =>
      //       setNameFilter(event.target.value)
      //     }
      //   />
      // ),
    },
    {
      header: "Kod",

      render: (warehouse) => (
        <span className="font-medium text-slate-700">
          {warehouse.code}
        </span>
      ),

      // filter: (
      //   <input
      //     className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Kod ara..."
      //     value={codeFilter}
      //     onChange={(event) =>
      //       setCodeFilter(event.target.value)
      //     }
      //   />
      // ),
    },
    {
      header: "Lokasyon",

      render: (warehouse) => (
        <div>
          <p className="font-medium text-slate-800">
            {[
              warehouse.cityName,
              warehouse.townName,
            ]
              .filter(Boolean)
              .join(" / ") || "-"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {[
              warehouse.districtName,
              warehouse.neighborhoodName,
            ]
              .filter(Boolean)
              .join(" / ") || "-"}
          </p>
        </div>
      ),

      filter: null,
    },
    {
      header: "Açık Adres",

      render: (warehouse) => (
        <span
          className="block max-w-[240px] truncate text-slate-600"
          title={warehouse.addressLine}
        >
          {warehouse.addressLine || "-"}
        </span>
      ),

      filter: null,
    },
    {
      header: "Malzeme",

      render: (warehouse) => (
        <button
          type="button"
          onClick={() => {
            setSelectedWarehouse(warehouse);
            setActiveDetailTab("materialStocks");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100"
        >
          <Boxes size={16} />

          {warehouse.materialWarehouses?.length ??
            0}
        </button>
      ),

      filter: null,
    },
    {
      header: "Ürün",

      render: (warehouse) => (
        <button
          type="button"
          onClick={() => {
            setSelectedWarehouse(warehouse);
            setActiveDetailTab("productStocks");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 font-semibold text-violet-700 hover:bg-violet-100"
        >
          <Package size={16} />

          {warehouse.productWarehouses?.length ??
            0}
        </button>
      ),

      filter: null,
    },
    {
      header: "Durum",

      render: (warehouse) => (
        <ActiveStatusBadge
          isActive={warehouse.isActive}
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

      render: (warehouse) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Detay"
            onClick={() => openDetail(warehouse)}
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

  const materialStocks =
    materialStocksQuery.data ?? [];

  const materialMovements =
    materialMovementsQuery.data ?? [];

  const totalMaterialQuantity =
    materialStocks.reduce(
      (total, stock) =>
        total + stock.totalQuantity,
      0
    );

  return (
    <div>
      <PageHeader
        title="Depolar"
        moduleName="Stok Yönetimi"
        description="Depoları, lokasyonlarını, malzeme ve ürün stoklarını yönetin."
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
              Yeni Depo
            </button>
          </div>
        }
      />

      {warehousesQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            warehousesQuery.error
          )}
        </div>
      )}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="min-w-[520px] flex-1">
      <LocationFilter
        value={locationFilter}
        onChange={setLocationFilter}
        showCountry={false}
      />
    </div>

    <div className="w-[125px]">
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
            label: "Depo Adı",
            value: "name",
          },
          {
            label: "Depo Kodu",
            value: "code",
          },
          {
            label: "Şehir",
            value: "city",
          },
          {
            label: "İlçe",
            value: "town",
          },
          {
            label: "Malzeme Sayısı",
            value: "materialCount",
          },
          {
            label: "Ürün Sayısı",
            value: "productCount",
          },
        ]}
      />
    </div>

    <div className="w-[115px]">
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

    <div className="w-[160px]">
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
          placeholder="Depo, lokasyon..."
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
        setStatusFilter("");
        setSortBy("name");
        setSortDirection("asc");
        setGlobalSearchText("");

        setLocationFilter({
          countryId: "",
          cityId: "",
          townId: "",
          districtId: "",
          neighborhoodId: "",
        });
      }}
      title="Filtreleri temizle"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <X size={16} />
      Temizle
    </button>

    <button
      type="button"
      onClick={() => warehousesQuery.refetch()}
      disabled={warehousesQuery.isFetching}
      title="Depoları yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          warehousesQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredWarehouses.length} depo bulundu`}
>
  <DataTable
    columns={columns}
    data={filteredWarehouses}
    loading={warehousesQuery.isLoading}
    emptyText="Depo bulunamadı."
    totalCount={filteredWarehouses.length}
  />
</Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Depo"
        subtitle="Depo bilgilerini ve lokasyonunu girin."
        onClose={closeCreateDrawer}
        widthClassName="w-[620px]"
      >
        {createMutation.isError && (
          <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {getErrorMessage(
              createMutation.error
            )}
          </div>
        )}

        <form
          onSubmit={submitWarehouse}
          className="space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Depo Adı"
              value={name}
              onChange={setName}
              placeholder="Örn: Merkez Depo"
              required
            />

            <TextInput
              label="Depo Kodu"
              value={code}
              onChange={setCode}
              placeholder="Örn: D-001"
              required
            />
          </div>

          <Card title="Lokasyon">
            <div className="p-5">
              <LocationSelector
                value={location}
                onChange={setLocation}
                showCountry={false}
              />
            </div>
          </Card>

          <TextInput
            label="Açık Adres"
            value={addressLine}
            onChange={setAddressLine}
            placeholder="Cadde, sokak, bina numarası..."
            required
          />

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending
              ? "Kaydediliyor..."
              : "Depoyu Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedWarehouse)}
        title={
          selectedWarehouse?.name ?? "Depo"
        }
        subtitle={
          selectedWarehouse
            ? `${selectedWarehouse.code} · ${selectedWarehouse.cityName ?? "-"}`
            : undefined
        }
        onClose={closeDetail}
        widthClassName="w-[900px]"
      >
        {selectedWarehouse && (
          <>
            <DrawerTabs
              activeTab={activeDetailTab}
              onChange={(key) =>
                setActiveDetailTab(
                  key as WarehouseDetailTab
                )
              }
              tabs={[
                {
                  key: "general",
                  label: "Genel Bilgiler",
                },
                {
                  key: "materialStocks",
                  label: "Malzeme Stokları",
                  count:
                    selectedWarehouse
                      .materialWarehouses?.length ??
                    0,
                },
                {
                  key: "materialMovements",
                  label: "Malzeme Hareketleri",
                },
                {
                  key: "productStocks",
                  label: "Ürün Stokları",
                  count:
                    selectedWarehouse
                      .productWarehouses?.length ??
                    0,
                },
              ]}
            />

            {activeDetailTab === "general" && (
              <WarehouseGeneralTab
                warehouse={selectedWarehouse}
              />
            )}

            {activeDetailTab ===
              "materialStocks" && (
              <MaterialStocksTab
                loading={
                  materialStocksQuery.isLoading
                }
                error={
                  materialStocksQuery.isError
                    ? materialStocksQuery.error
                    : null
                }
                stocks={materialStocks}
                totalQuantity={
                  totalMaterialQuantity
                }
              />
            )}

            {activeDetailTab ===
              "materialMovements" && (
              <MaterialMovementsTab
                loading={
                  materialMovementsQuery.isLoading
                }
                error={
                  materialMovementsQuery.isError
                    ? materialMovementsQuery.error
                    : null
                }
                movements={materialMovements}
              />
            )}

            {activeDetailTab ===
              "productStocks" && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <Package
                  size={36}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Ürün stokları
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  ProductWarehouse stock endpointi
                  hazır olduğunda bu sekmeyi gerçek
                  veriye bağlayacağız.
                </p>
              </div>
            )}
          </>
        )}
      </DetailDrawer>
    </div>
  );
}

function WarehouseGeneralTab({
  warehouse,
}: {
  warehouse: Warehouse;
}) {
  const materialCount =
    warehouse.materialWarehouses?.length ?? 0;

  const productCount =
    warehouse.productWarehouses?.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Malzeme Kaydı
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {materialCount}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Ürün Kaydı
          </p>

          <p className="mt-2 text-2xl font-bold text-violet-700">
            {productCount}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Durum
          </p>

          <div className="mt-3">
            <ActiveStatusBadge
              isActive={warehouse.isActive}
            />
          </div>
        </Card>
      </div>

      <Card title="Depo Bilgileri">
        <div className="grid grid-cols-2 gap-5 p-5 text-sm">
          <DetailItem
            label="Depo Adı"
            value={warehouse.name}
          />

          <DetailItem
            label="Depo Kodu"
            value={warehouse.code}
          />

          <DetailItem
            label="Ülke"
            value={warehouse.countryName || "-"}
          />

          <DetailItem
            label="Şehir"
            value={warehouse.cityName || "-"}
          />

          <DetailItem
            label="İlçe"
            value={warehouse.townName || "-"}
          />

          <DetailItem
            label="Semt / Bölge"
            value={warehouse.districtName || "-"}
          />

          <DetailItem
            label="Mahalle"
            value={
              warehouse.neighborhoodName || "-"
            }
          />

          <div className="col-span-2">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <MapPin
                size={20}
                className="mt-0.5 text-indigo-600"
              />

              <div>
                <p className="text-xs text-slate-400">
                  Açık Adres
                </p>

                <p className="mt-1 font-medium text-slate-800">
                  {warehouse.addressLine || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface MaterialStocksTabProps {
  loading: boolean;
  error: unknown;
  stocks: MaterialStock[];
  totalQuantity: number;
}

function MaterialStocksTab({
  loading,
  error,
  stocks,
  totalQuantity,
}: MaterialStocksTabProps) {
  if (loading) {
    return (
      <div className="py-10 text-center text-slate-500">
        Malzeme stokları yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
        {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Malzeme Çeşidi
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {stocks.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Birimlerden Bağımsız Toplam
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalQuantity.toLocaleString(
              "tr-TR"
            )}
          </p>

          <p className="mt-1 text-xs text-amber-600">
            Farklı birimlerin toplamıdır; finansal
            veya fiziksel karşılaştırmada kullanılmaz.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stocks.map((stock) => (
          <Card
            key={`${stock.materialId}-${stock.warehouseId}`}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {stock.materialName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {stock.materialCode}
                </p>
              </div>

              <WarehouseIcon
                size={20}
                className="text-blue-600"
              />
            </div>

            <p
              className={`mt-5 text-2xl font-bold ${
                stock.totalQuantity < 0
                  ? "text-red-700"
                  : stock.totalQuantity === 0
                    ? "text-amber-700"
                    : "text-emerald-700"
              }`}
            >
              {stock.totalQuantity.toLocaleString(
                "tr-TR"
              )}{" "}
              {stock.materialUnit}
            </p>

            <div className="mt-3">
              <StatusBadge
                text={
                  stock.totalQuantity < 0
                    ? "Negatif Stok"
                    : stock.totalQuantity === 0
                      ? "Stok Yok"
                      : "Stokta"
                }
                color={
                  stock.totalQuantity < 0
                    ? "danger"
                    : stock.totalQuantity === 0
                      ? "warning"
                      : "success"
                }
              />
            </div>
          </Card>
        ))}

        {stocks.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Bu depoda malzeme stok kaydı
            bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}

interface MaterialMovementsTabProps {
  loading: boolean;
  error: unknown;
  movements: MaterialWarehouse[];
}

function MaterialMovementsTab({
  loading,
  error,
  movements,
}: MaterialMovementsTabProps) {
  if (loading) {
    return (
      <div className="py-10 text-center text-slate-500">
        Malzeme hareketleri yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
        {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <Card title="Son Malzeme Hareketleri">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">
                Malzeme
              </th>

              <th className="px-4 py-3 text-left">
                Kod
              </th>

              <th className="px-4 py-3 text-left">
                Hareket
              </th>

              <th className="px-4 py-3 text-left">
                Miktar
              </th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => (
              <tr
                key={movement.id}
                className="border-t border-slate-100"
              >
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {movement.materialName}
                </td>

                <td className="px-4 py-3">
                  {movement.materialCode}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge
                    text={
                      movement.quantity >= 0
                        ? "Giriş"
                        : "Çıkış"
                    }
                    color={
                      movement.quantity >= 0
                        ? "success"
                        : "danger"
                    }
                  />
                </td>

                <td
                  className={`px-4 py-3 font-bold ${
                    movement.quantity >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {movement.quantity > 0
                    ? "+"
                    : ""}
                  {movement.quantity.toLocaleString(
                    "tr-TR"
                  )}{" "}
                  {movement.materialUnit}
                </td>
              </tr>
            ))}

            {movements.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Bu depoda malzeme hareketi
                  bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
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