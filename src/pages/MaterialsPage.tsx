import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Download,
  Edit,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";

import TextInput from "../components/form/TextInput";
import TextArea from "../components/form/TextArea";
import SelectInput from "../components/form/SelectInput";
import MultiSelect from "../components/form/MultiSelect";

import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";
import DrawerTabs from "../components/drawer/DrawerTabs";

import ActiveStatusBadge from "../components/common/ActiveStatusBadge";
import StatusBadge from "../components/common/StatusBadge";

import {
  materialService,
  type Material,
} from "../services/materialService";

import { getErrorMessage } from "../utils/apiResponse";
import { useParameterOptions } from "../hooks/useParameterOptions";

type MaterialDetailTab =
  | "general"
  | "warehouses"
  | "suppliers"
  | "production";

export default function MaterialsPage() {
  const queryClient = useQueryClient();

  const unitParameters = useParameterOptions("MaterialUnit", 1);

  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<Material | null>(null);

  const [activeDetailTab, setActiveDetailTab] =
    useState<MaterialDetailTab>("general");

  // Create form
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Filters
  const [globalSearchText, setGlobalSearchText] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [stockStatusFilter, setStockStatusFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: materialService.getList,
  });

  const supplierMaterialsQuery = useQuery({
    queryKey: [
      "supplier-materials",
      "by-material",
      selectedMaterial?.id,
    ],
    queryFn: () =>
      materialService.getSupplierMaterials(selectedMaterial!.id),
    enabled:
      Boolean(selectedMaterial?.id) &&
      activeDetailTab === "suppliers",
  });

  const warehouseStocksQuery = useQuery({
    queryKey: [
      "material-warehouses",
      "by-material",
      selectedMaterial?.id,
    ],
    queryFn: () =>
      materialService.getWarehouseStocks(selectedMaterial!.id),
    enabled:
      Boolean(selectedMaterial?.id) &&
      activeDetailTab === "warehouses",
  });

  const createMutation = useMutation({
    mutationFn: materialService.create,
    onSuccess: async () => {
      resetCreateForm();
      setShowCreateDrawer(false);

      await queryClient.invalidateQueries({
        queryKey: ["materials"],
      });
    },
  });

  const materials = materialsQuery.data ?? [];

  const unitOptions = useMemo(() => {
    if (unitParameters.options.length > 0) {
      return unitParameters.options;
    }

    const unitMap = new Map<
      number,
      string
    >();

    materials.forEach((material) => {
      if (
        material.unit != null &&
        material.unitName
      ) {
        unitMap.set(
          material.unit,
          material.unitName
        );
      }
    });

    return Array.from(
      unitMap.entries()
    ).map(([unitCode, unitName]) => ({
      label: unitName,
      value: String(unitCode),
    }));
  }, [materials, unitParameters.options]);

  const resetCreateForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setUnit("");
    setCostPrice("");
    setTaxRate("");
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    resetCreateForm();
    createMutation.reset();
  };

  const openDetail = (material: Material) => {
    setSelectedMaterial(material);
    setActiveDetailTab("general");
  };

  const closeDetail = () => {
    setSelectedMaterial(null);
    setActiveDetailTab("general");
  };

  const createMaterial = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim() || !code.trim() || !unit) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      code: code.trim(),
      description:
        description.trim() || null,
      unit: Number(unit),
      taxRate: Number(taxRate || 0),
      stockQuantity: 0,
    });
  };

  const filteredMaterials = useMemo(() => {
    let list = [...materials];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (material) =>
          material.name
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          material.code
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          material.description
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          material.unitName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (nameFilter.trim()) {
      const search = nameFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((material) =>
        material.name
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (codeFilter.trim()) {
      const search = codeFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((material) =>
        material.code
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (selectedUnits.length > 0) {
      list = list.filter((material) =>
        selectedUnits.includes(String(material.unit))
      );
    }

    if (stockStatusFilter === "inStock") {
      list = list.filter(
        (material) => material.stockQuantity > 10
      );
    }

    if (stockStatusFilter === "critical") {
      list = list.filter(
        (material) =>
          material.stockQuantity > 0 &&
          material.stockQuantity <= 10
      );
    }

    if (stockStatusFilter === "outOfStock") {
      list = list.filter(
        (material) => material.stockQuantity <= 0
      );
    }

    if (statusFilter) {
      list = list.filter((material) =>
        statusFilter === "active"
          ? material.isActive
          : !material.isActive
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

      if (sortBy === "costPrice") {
        result = first.averageCost! - second.averageCost!;
      }

      if (sortBy === "stockQuantity") {
        result =
          first.stockQuantity - second.stockQuantity;
      }

      if (sortBy === "supplierCount") {
        result =
          first.supplierCount - second.supplierCount;
      }

      if (sortBy === "warehouseCount") {
        result =
          first.warehouseCount - second.warehouseCount;
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    materials,
    globalSearchText,
    nameFilter,
    codeFilter,
    selectedUnits,
    stockStatusFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return (
        <StatusBadge
          text="Tükendi"
          color="danger"
        />
      );
    }

    if (quantity <= 10) {
      return (
        <StatusBadge
          text="Kritik"
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

  const columns: DataTableColumn<Material>[] = [
    {
      header: "Malzeme",
      render: (material) => (
        <button
          type="button"
          onClick={() => openDetail(material)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {material.name}
          </p>

          <p className="text-xs text-slate-400">
            ID: {material.id}
          </p>
        </button>
      ),
      // filter: (
      //   <input
      //     className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Malzeme ara..."
      //     value={nameFilter}
      //     onChange={(event) =>
      //       setNameFilter(event.target.value)
      //     }
      //   />
      // ),
    },
    {
      header: "Kod",
      render: (material) => (
        <span className="font-medium text-slate-700">
          {material.code}
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
      header: "Birim",
      render: (material) => material.unitName || "-",
      filter: null,
    },
    {
      header: "Ortalama Maliyet",
      render: (material) =>
        material.averageCost != null ? (
          <span className="font-medium text-slate-800">
            {material.averageCost.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ) : (
          <span className="text-sm text-slate-400">
            Henüz tedarik edilmedi
          </span>
        ),
    },
    {
      header: "Son Alış Fiyatı",
      render: (material) =>
        material.lastPurchasePrice != null ? (
          <span className="font-medium text-slate-800">
            {material.lastPurchasePrice.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ) : (
          <span className="text-sm text-slate-400">
            Henüz tedarik edilmedi
          </span>
        ),
    },
    {
      header: "KDV",
      render: (material) => `%${material.taxRate}`,
      filter: null,
    },
    {
      header: "Toplam Stok",
      render: (material) => (
        <div>
          <p className="font-semibold text-slate-800">
            {material.stockQuantity.toLocaleString(
              "tr-TR"
            )}{" "}
            {material.unitName}
          </p>

          <div className="mt-1">
            {getStockBadge(material.stockQuantity)}
          </div>
        </div>
      ),
      filter: null,
    },
    {
      header: "Tedarikçi",
      render: (material) => (
        <button
          type="button"
          onClick={() => {
            openDetail(material);
            setActiveDetailTab("suppliers");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 font-semibold text-violet-700 hover:bg-violet-100"
        >
          <Truck size={16} />
          {material.supplierCount}
        </button>
      ),
      filter: null,
    },
    {
      header: "Depo",
      render: (material) => (
        <button
          type="button"
          onClick={() => {
            openDetail(material);
            setActiveDetailTab("warehouses");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100"
        >
          <Warehouse size={16} />
          {material.warehouseCount}
        </button>
      ),
      filter: null,
    },
    {
      header: "Durum",
      render: (material) => (
        <ActiveStatusBadge
          isActive={material.isActive}
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
      render: (material) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Detay"
            onClick={() => openDetail(material)}
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

  const supplierMaterials =
    supplierMaterialsQuery.data ?? [];

  const warehouseStocks =
    warehouseStocksQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Malzemeler"
        moduleName="Satın Alma"
        description="Hammadde ve sarf malzemelerini, stoklarını ve tedarikçilerini yönetin."
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
              Yeni Malzeme
            </button>
          </div>
        }
      />

      {materialsQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(materialsQuery.error)}
        </div>
      )}

      {createMutation.isError && (
        <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(createMutation.error)}
        </div>
      )}

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[140px]">
            <MultiSelect
              label="Birim"
              values={selectedUnits}
              onChange={setSelectedUnits}
              placeholder="Birim"
              options={unitOptions}
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
                  value: "inStock",
                },
                {
                  label: "Kritik",
                  value: "critical",
                },
                {
                  label: "Tükendi",
                  value: "outOfStock",
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

          <div className="w-[160px]">
            <SelectInput
              label="Sırala"
              value={sortBy}
              onChange={setSortBy}
              options={[
                {
                  label: "Malzeme Adı",
                  value: "name",
                },
                {
                  label: "Malzeme Kodu",
                  value: "code",
                },
                {
                  label: "Maliyet",
                  value: "costPrice",
                },
                {
                  label: "Toplam Stok",
                  value: "stockQuantity",
                },
                {
                  label: "Tedarikçi Sayısı",
                  value: "supplierCount",
                },
                {
                  label: "Depo Sayısı",
                  value: "warehouseCount",
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
              setSelectedUnits([]);
              setStockStatusFilter("");
              setStatusFilter("");
              setSortBy("name");
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
            onClick={() => materialsQuery.refetch()}
            disabled={materialsQuery.isFetching}
            title="Malzemeleri yenile"
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={
                materialsQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Yenile
          </button>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredMaterials.length} malzeme bulundu`}
      >
        <DataTable
          columns={columns}
          data={filteredMaterials}
          loading={materialsQuery.isLoading}
          emptyText="Malzeme bulunamadı."
          totalCount={filteredMaterials.length}
        />
      </Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Malzeme"
        subtitle="Malzemenin temel bilgilerini girin."
        onClose={closeCreateDrawer}
        widthClassName="w-[600px]"
      >
        <form
          onSubmit={createMaterial}
          className="space-y-5"
        >
          <TextInput
            label="Malzeme Adı"
            value={name}
            onChange={setName}
            placeholder="Örn: Alüminyum Levha"
            required
          />

          <TextInput
            label="Malzeme Kodu"
            value={code}
            onChange={setCode}
            placeholder="Örn: HMD-001"
            required
          />

          <TextArea
            label="Açıklama"
            value={description}
            onChange={setDescription}
            placeholder="Malzemeyle ilgili açıklama"
          />

          <SelectInput
            label="Birim"
            value={unit}
            onChange={setUnit}
            placeholder={
              unitParameters.isLoading
                ? "Yükleniyor..."
                : "Birim seçiniz"
            }
            options={unitOptions}
          />

          <TextInput
            label="KDV Oranı"
            value={taxRate}
            onChange={setTaxRate}
            type="number"
            required
          />

          <button
            disabled={createMutation.isPending}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending
              ? "Kaydediliyor..."
              : "Malzemeyi Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedMaterial)}
        title={selectedMaterial?.name ?? "Malzeme"}
        subtitle={
          selectedMaterial
            ? `${selectedMaterial.code} · ${selectedMaterial.unitName}`
            : undefined
        }
        onClose={closeDetail}
        widthClassName="w-[820px]"
      >
        {selectedMaterial && (
          <>
            <DrawerTabs
              activeTab={activeDetailTab}
              onChange={(key) =>
                setActiveDetailTab(
                  key as MaterialDetailTab
                )
              }
              tabs={[
                {
                  key: "general",
                  label: "Genel Bilgiler",
                },
                {
                  key: "warehouses",
                  label: "Depo Stokları",
                  count:
                    selectedMaterial.warehouseCount,
                },
                {
                  key: "suppliers",
                  label: "Tedarikçiler",
                  count:
                    selectedMaterial.supplierCount,
                },
                {
                  key: "production",
                  label: "Üretim Kullanımı",
                },
              ]}
            />

            {activeDetailTab === "general" && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-5">
                    <p className="text-sm text-slate-500">
                      Toplam Stok
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {selectedMaterial.stockQuantity.toLocaleString(
                        "tr-TR"
                      )}{" "}
                      {selectedMaterial.unitName}
                    </p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-sm text-slate-500">
                      Tedarikçi Sayısı
                    </p>

                    <p className="mt-2 text-2xl font-bold text-violet-700">
                      {selectedMaterial.supplierCount}
                    </p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-sm text-slate-500">
                      Depo Sayısı
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-700">
                      {selectedMaterial.warehouseCount}
                    </p>
                  </Card>
                </div>

                <Card title="Temel Bilgiler">
                  <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                    <DetailItem
                      label="Malzeme Adı"
                      value={selectedMaterial.name}
                    />

                    <DetailItem
                      label="Malzeme Kodu"
                      value={selectedMaterial.code}
                    />

                    <DetailItem
                      label="Birim"
                      value={selectedMaterial.unitName ?? ""}
                    />

                    <DetailItem
                      label="Ortalama Maliyet"
                      value={selectedMaterial.averageCost!.toLocaleString(
                        "tr-TR",
                        {
                          minimumFractionDigits: 4,
                        }
                      )}
                    />

                    <DetailItem
                      label="Son Maliyet"
                      value={selectedMaterial.lastPurchasePrice!.toLocaleString(
                        "tr-TR",
                        {
                          minimumFractionDigits: 4,
                        }
                      )}
                    />

                    <DetailItem
                      label="KDV Oranı"
                      value={`%${selectedMaterial.taxRate}`}
                    />

                    <div>
                      <p className="text-slate-400">
                        Durum
                      </p>

                      <div className="mt-1">
                        <ActiveStatusBadge
                          isActive={
                            selectedMaterial.isActive
                          }
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <DetailItem
                        label="Açıklama"
                        value={
                          selectedMaterial.description ||
                          "-"
                        }
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeDetailTab === "warehouses" && (
              <div>
                {warehouseStocksQuery.isLoading && (
                  <div className="py-10 text-center text-slate-500">
                    Depo stokları yükleniyor...
                  </div>
                )}

                {warehouseStocksQuery.isError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
                    {getErrorMessage(
                      warehouseStocksQuery.error
                    )}
                  </div>
                )}

                {!warehouseStocksQuery.isLoading &&
                  !warehouseStocksQuery.isError && (
                    <div className="grid grid-cols-2 gap-4">
                      {warehouseStocks.map((stock) => (
                        <Card
                          key={stock.id}
                          className="p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {stock.warehouseName}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {stock.warehouseCode}
                              </p>
                            </div>

                            <Warehouse
                              size={20}
                              className="text-blue-600"
                            />
                          </div>

                          <p className="mt-5 text-2xl font-bold text-slate-900">
                            {stock.quantity.toLocaleString(
                              "tr-TR"
                            )}{" "}
                            {stock.materialUnitName}
                          </p>
                        </Card>
                      ))}

                      {warehouseStocks.length === 0 && (
                        <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                          Bu malzemenin herhangi bir
                          depoda stok kaydı bulunmuyor.
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {activeDetailTab === "suppliers" && (
              <div>
                {supplierMaterialsQuery.isLoading && (
                  <div className="py-10 text-center text-slate-500">
                    Tedarikçiler yükleniyor...
                  </div>
                )}

                {supplierMaterialsQuery.isError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
                    {getErrorMessage(
                      supplierMaterialsQuery.error
                    )}
                  </div>
                )}

                {!supplierMaterialsQuery.isLoading &&
                  !supplierMaterialsQuery.isError && (
                    <div className="space-y-4">
                      {supplierMaterials.map(
                        (supplierMaterial) => (
                          <Card
                            key={supplierMaterial.id}
                            className="p-5"
                          >
                            <div className="flex items-start justify-between gap-5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Truck
                                    size={18}
                                    className="text-violet-600"
                                  />

                                  <p className="font-semibold text-slate-900">
                                    {supplierMaterial.supplierName ||
                                      "Tedarikçi"}
                                  </p>
                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                  Teslim süresi:{" "}
                                  {supplierMaterial.leadTimeDays ??
                                    "-"}{" "}
                                  gün
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  Minimum sipariş:{" "}
                                  {supplierMaterial.moq ??
                                    "-"}{" "}
                                  {
                                    supplierMaterial.materialUnit
                                  }
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-slate-400">
                                  Birim Fiyat
                                </p>

                                <p className="mt-1 text-xl font-bold text-slate-900">
                                  {supplierMaterial.unitPrice.toLocaleString(
                                    "tr-TR",
                                    {
                                      minimumFractionDigits: 2,
                                    }
                                  )}{" "}
                                  {
                                    supplierMaterial.currencyName
                                  }
                                </p>

                                <p className="mt-2 text-xs text-slate-400 line-through">
                                  Liste:{" "}
                                  {supplierMaterial.listPrice.toLocaleString(
                                    "tr-TR",
                                    {
                                      minimumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </Card>
                        )
                      )}

                      {supplierMaterials.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                          Bu malzemeye bağlı tedarikçi
                          bulunmuyor.
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

            {activeDetailTab === "production" && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <Boxes
                  size={34}
                  className="mx-auto text-slate-400"
                />

                <h3 className="mt-4 font-semibold text-slate-900">
                  Üretim kullanımı
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  ProductionItem endpointi bağlandığında
                  planlanan, gerçekleşen ve fire miktarları
                  burada gösterilecek.
                </p>
              </div>
            )}
          </>
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