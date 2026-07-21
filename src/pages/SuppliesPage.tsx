import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Download,
  Eye,
  PackagePlus,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
  Edit,
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
import DrawerTabs from "../components/drawer/DrawerTabs";

import ConfirmDialog from "../components/common/ConfirmDialog";
import ActiveStatusBadge from "../components/common/ActiveStatusBadge";
import StatusBadge from "../components/common/StatusBadge";

import { supplyService } from "../services/supplyService";

import type {
  AllowedWorkflowTransition,
  Supply,
} from "../services/supplyService";

import {
  supplierMaterialService,
  type SupplierMaterial,
} from "../services/supplierMaterialService";

import { supplierService } from "../services/supplierService";
import { warehouseService } from "../services/warehouseService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

interface SupplyLine {
  rowId: string;
  supplierMaterialId: string;
  warehouseId: string;
  quantity: string;
  unitPrice: string;
  discountRate: string;
}

type SupplyDetailTab =
  | "general"
  | "items"
  | "history";

function createEmptyLine(): SupplyLine {
  return {
    rowId: crypto.randomUUID(),
    supplierMaterialId: "",
    warehouseId: "",
    quantity: "",
    unitPrice: "",
    discountRate: "0",
  };
}

export default function SuppliesPage() {
  const queryClient = useQueryClient();

  const supplyStatuses =
    useParameterOptions("SupplyStatus");

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [selectedSupply, setSelectedSupply] =
    useState<Supply | null>(null);

  const [activeDetailTab, setActiveDetailTab] =
    useState<SupplyDetailTab>("general");

  const [transitionTarget, setTransitionTarget] = useState<{
    supply: Supply;
    transition: AllowedWorkflowTransition;
  } | null>(null);

const [transitionNote, setTransitionNote] = useState("");

  // Create form
  const [supplierId, setSupplierId] = useState("");

  const [supplyDate, setSupplyDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [supplyStatus, setSupplyStatus] =
    useState("");

  const [lines, setLines] = useState<SupplyLine[]>([
    createEmptyLine(),
  ]);

  // Filters
  const [selectedSupplierIds, setSelectedSupplierIds] =
    useState<string[]>([]);

  const [selectedStatusCodes, setSelectedStatusCodes] =
    useState<string[]>([]);

  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const [documentFilter, setDocumentFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("supplyDate");

  const [sortDirection, setSortDirection] =
    useState("desc");

  const [transitionDocumentNumber, setTransitionDocumentNumber] = useState("");

  const suppliesQuery = useQuery({
    queryKey: ["supplies"],
    queryFn: () =>
      supplyService.getList({
        isDeleted: false,
      }),
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierService.getList,
  });

  const supplierMaterialsQuery = useQuery({
    queryKey: [
      "supplier-materials",
      "supplier",
      supplierId,
    ],

    queryFn: () =>
      supplierMaterialService.getList({
        supplierId: Number(supplierId),
        isActive: true,
        isDeleted: false,
      }),

    enabled: Boolean(supplierId),
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const createMutation = useMutation({
    mutationFn: supplyService.create,

    onSuccess: async () => {
      closeCreateDrawer();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["supplies"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-warehouses"],
        }),
      ]);
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: supplyService.changeStatus,

    onSuccess: async (_, variables) => {
      const changedSupplyId = variables.supplyId;

      setTransitionTarget(null);
      setTransitionDocumentNumber("");
      setTransitionNote("");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["supplies"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-warehouses"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["materials"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["warehouses"],
        }),
      ]);

      const refreshedResult = await suppliesQuery.refetch();

      const updatedSupply = refreshedResult.data?.find(
        (supply) => supply.id === changedSupplyId
      );

      setSelectedSupply(updatedSupply ?? null);
    },
  });

  const requestStatusTransition = (
    supply: Supply,
    transition: AllowedWorkflowTransition
  ) => {
    if (transition.requiresConfirmation) {
      setTransitionTarget({
        supply,
        transition,
      });

      return;
    }

    changeStatusMutation.mutate({
      supplyId: supply.id,
      targetStatusCode: transition.targetStatusCode,
      note: null,
    });
  };

  const supplies = suppliesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const supplierMaterials =
    supplierMaterialsQuery.data ?? [];

  const warehouses = warehousesQuery.data ?? [];

  const supplierOptions = useMemo(
    () =>
      suppliers
        .filter((supplier) => supplier.isActive)
        .map((supplier) => ({
          label: supplier.name,
          value: String(supplier.id),
        })),
    [suppliers]
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

  const supplierMaterialOptions = useMemo(
    () =>
      supplierMaterials.map((item) => ({
        label: `${item.materialName ?? "Malzeme"} (${item.materialCode}) · ${item.currencyName} · ${formatMoney(item.unitPrice, item.currencyName)}`,
        value: String(item.id),
      })),
    [supplierMaterials]
  );

  const defaultSupplyStatus = useMemo(() => {
    const defaultStatus =
      supplyStatuses.data?.find(
        (item) => item.isDefault
      );

    return defaultStatus
      ? String(defaultStatus.paramCode)
      : "";
  }, [supplyStatuses.data]);

  const resetCreateForm = () => {
    setSupplierId("");
    setSupplyDate(
      new Date().toISOString().slice(0, 10)
    );
    setSupplyStatus(defaultSupplyStatus);
    setLines([createEmptyLine()]);
    createMutation.reset();
  };

  const isDeliveryTransition =
  transitionTarget?.transition.statusShortCode
    ?.trim()
    .toLocaleLowerCase("tr-TR") === "delivered";

  console.log("Transition", transitionTarget?.transition);
  console.log("ShortCode", transitionTarget?.transition.statusShortCode);
  console.log("isDelivery", isDeliveryTransition);

  const openCreateDrawer = () => {
    resetCreateForm();
    setShowCreateDrawer(true);
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    resetCreateForm();
  };

  const openDetail = (supply: Supply) => {
    setSelectedSupply(supply);
    setActiveDetailTab("general");
  };

  const closeDetail = () => {
    setSelectedSupply(null);
    setActiveDetailTab("general");
  };

  const handleSupplierChange = (value: string) => {
    setSupplierId(value);
    setLines([createEmptyLine()]);
  };

  const addLine = () => {
    setLines((previous) => [
      ...previous,
      createEmptyLine(),
    ]);
  };

  const removeLine = (rowId: string) => {
    setLines((previous) => {
      const next = previous.filter(
        (line) => line.rowId !== rowId
      );

      return next.length > 0
        ? next
        : [createEmptyLine()];
    });
  };

  const updateLine = (
    rowId: string,
    field: keyof Omit<SupplyLine, "rowId">,
    value: string
  ) => {
    setLines((previous) =>
      previous.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    );
  };

  const handleSupplierMaterialChange = (
    rowId: string,
    supplierMaterialIdValue: string
  ) => {
    const supplierMaterial =
      supplierMaterials.find(
        (item) =>
          String(item.id) ===
          supplierMaterialIdValue
      );

    setLines((previous) =>
      previous.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              supplierMaterialId:
                supplierMaterialIdValue,
              unitPrice: supplierMaterial
                ? String(
                    supplierMaterial.unitPrice
                  )
                : "",
            }
          : line
      )
    );
  };

  const getSupplierMaterial = (
    line: SupplyLine
  ): SupplierMaterial | undefined => {
    return supplierMaterials.find(
      (item) =>
        String(item.id) ===
        line.supplierMaterialId
    );
  };

  const calculateLine = (line: SupplyLine) => {
    const supplierMaterial =
      getSupplierMaterial(line);

    const quantity = Number(line.quantity || 0);

    const unitPrice = Number(
      line.unitPrice ||
        supplierMaterial?.unitPrice ||
        0
    );

    const discountRate = Number(
      line.discountRate || 0
    );

    const taxRate = Number(
      supplierMaterial?.taxRate ?? 0
    );

    const grossAmount = unitPrice * quantity;

    const discountAmount =
      grossAmount * (discountRate / 100);

    const netAmount =
      grossAmount - discountAmount;

    const taxAmount =
      netAmount * (taxRate / 100);

    const totalPrice =
      netAmount + taxAmount;

    return {
      quantity,
      unitPrice,
      discountRate,
      taxRate,
      grossAmount,
      discountAmount,
      netAmount,
      taxAmount,
      totalPrice,
    };
  };

  const createPreview = useMemo(() => {
    return lines.reduce(
      (summary, line) => {
        const calculation =
          calculateLine(line);

        return {
          netAmount:
            summary.netAmount +
            calculation.netAmount,

          taxAmount:
            summary.taxAmount +
            calculation.taxAmount,

          totalAmount:
            summary.totalAmount +
            calculation.totalPrice,
        };
      },
      {
        netAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
      }
    );
  }, [lines, supplierMaterials]);

  const submitSupply = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !supplierId ||
      !supplyDate ||
      !supplyStatus
    ) {
      return;
    }

    const validLines = lines.filter(
      (line) =>
        line.supplierMaterialId &&
        line.warehouseId &&
        Number(line.quantity) > 0
    );

    if (validLines.length === 0) {
      return;
    }

    createMutation.mutate({
      totalAmount: createPreview.totalAmount,
      supplyDate: new Date(
        `${supplyDate}T00:00:00`
      ).toISOString(),

      supplyStatus:
        Number(supplyStatus),

      supplierId: Number(supplierId),

      supplyItems: validLines.map((line) => ({
        supplierMaterialId: Number(
          line.supplierMaterialId
        ),

        warehouseId: Number(
          line.warehouseId
        ),

        quantity: Number(line.quantity),

        unitPrice: line.unitPrice
          ? Number(line.unitPrice)
          : null,

        discountRate: Number(
          line.discountRate || 0
        ),
      })),
    });
  };

  const filteredSupplies = useMemo(() => {
    let list = [...supplies];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (supply) =>
          supply.documentNumber
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          supply.supplierName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          supply.employeeName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          supply.supplyStatusName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (documentFilter.trim()) {
      const search = documentFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((supply) =>
        supply.documentNumber
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (selectedSupplierIds.length > 0) {
      list = list.filter((supply) =>
        supply.supplierId != null &&
        selectedSupplierIds.includes(
          String(supply.supplierId)
        )
      );
    }

    if (selectedStatusCodes.length > 0) {
      list = list.filter((supply) =>
        supply.supplyStatus != null &&
        selectedStatusCodes.includes(
          String(supply.supplyStatus)
        )
      );
    }

    if (statusFilter) {
      list = list.filter((supply) =>
        statusFilter === "active"
          ? supply.isActive
          : !supply.isActive
      );
    }

    list.sort((first, second) => {
      let result = 0;

      if (sortBy === "supplyDate") {
        result =
          new Date(first.supplyDate).getTime() -
          new Date(second.supplyDate).getTime();
      }

      if (sortBy === "deliveryDate") {
        result =
          new Date(
            first.deliveryDate ?? 0
          ).getTime() -
          new Date(
            second.deliveryDate ?? 0
          ).getTime();
      }

      if (sortBy === "supplierName") {
        result = (
          first.supplierName ?? ""
        ).localeCompare(
          second.supplierName ?? "",
          "tr"
        );
      }

      if (sortBy === "documentNumber") {
        result =
          first.documentNumber!.localeCompare(
            second.documentNumber!,
            "tr"
          );
      }

      if (sortBy === "totalAmount") {
        result =
          first.totalAmount -
          second.totalAmount;
      }

      if (sortBy === "itemCount") {
        result =
          (first.supplyItems?.length ?? 0) -
          (second.supplyItems?.length ?? 0);
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    supplies,
    globalSearchText,
    documentFilter,
    selectedSupplierIds,
    selectedStatusCodes,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const columns: DataTableColumn<Supply>[] = [
    {
      header: "Belge",

      render: (supply) => (
        <button
          type="button"
          onClick={() => openDetail(supply)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {supply.documentNumber}
          </p>

          <p className="text-xs text-slate-400">
            ID: {supply.id}
          </p>
        </button>
      ),

      // filter: (
      //   <input
      //     className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Belge ara..."
      //     value={documentFilter}
      //     onChange={(event) =>
      //       setDocumentFilter(
      //         event.target.value
      //       )
      //     }
      //   />
      // ),
    },
    {
      header: "Tedarikçi",

      render: (supply) => (
        <div>
          <p className="font-semibold text-slate-800">
            {supply.supplierName ?? "-"}
          </p>

          <p className="text-xs text-slate-400">
            {supply.employeeName
              ? `Sorumlu: ${supply.employeeName}`
              : "Sorumlu belirtilmemiş"}
          </p>
        </div>
      ),

      filter: null,
    },
    {
      header: "Durum",
      render: (supply) => (
        <StatusBadge
          text={supply.supplyStatusName ?? "Tanımsız"}
          color={supply.supplyStatusBadgeColor ?? "neutral"}
        />
      ),
      filter: null,
    },
    {
      header: "Tedarik Tarihi",

      render: (supply) =>
        formatDate(supply.supplyDate),

      filter: null,
    },
    {
      header: "Teslim Tarihi",

      render: (supply) =>
        supply.deliveryDate
          ? formatDate(supply.deliveryDate)
          : "-",

      filter: null,
    },
    {
      header: "Kalem",

      render: (supply) => (
        <button
          type="button"
          onClick={() => {
            setSelectedSupply(supply);
            setActiveDetailTab("items");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100"
        >
          <PackagePlus size={16} />
          {supply.supplyItems?.length ?? 0}
        </button>
      ),

      filter: null,
    },
    {
      header: "Toplam",

      render: (supply) => (
        <p className="font-bold text-slate-900">
          {supply.totalAmount.toLocaleString(
            "tr-TR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </p>
      ),

      filter: null,
    },
    {
      header: "Kayıt",

      render: (supply) => (
        <ActiveStatusBadge
          isActive={supply.isActive}
        />
      ),

      filter: null,
    },
    {

      header: "İşlemler",

      render: (supply) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            title="Detay"
            onClick={() => openDetail(supply)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
          >
            <Eye size={16} />
          </button>

          {supply.actions?.canEdit && (
            <button
              type="button"
              title="Düzenle"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            >
              <Edit size={16} />
            </button>
          )}

          {supply.allowedTransitions?.map((transition) => (
            <button
              key={transition.targetStatusCode}
              type="button"
              title={transition.actionName}
              disabled={changeStatusMutation.isPending}
              onClick={() =>
                requestStatusTransition(supply, transition)
              }
              className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {transition.actionName}
            </button>
          ))}

          {supply.actions?.canDelete && (
            <button
              type="button"
              title="Sil"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),

      filter: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tedarikler"
        moduleName="Satın Alma"
        description="Tedarik siparişlerini, kalemlerini, fiyatlarını ve teslim süreçlerini yönetin."
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
              onClick={openCreateDrawer}
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Tedarik
            </button>
          </div>
        }
      />

      {suppliesQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            suppliesQuery.error
          )}
        </div>
      )}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="w-[165px]">
      <MultiSelect
        label="Tedarikçi"
        values={selectedSupplierIds}
        onChange={setSelectedSupplierIds}
        placeholder="Tedarikçi"
        options={supplierOptions}
      />
    </div>

    <div className="w-[165px]">
      <MultiSelect
        label="Tedarik Durumu"
        values={selectedStatusCodes}
        onChange={setSelectedStatusCodes}
        placeholder="Durum"
        options={supplyStatuses.options}
      />
    </div>

    <div className="w-[155px]">
      <SelectInput
        label="Sırala"
        value={sortBy}
        onChange={setSortBy}
        options={[
          {
            label: "Tedarik Tarihi",
            value: "supplyDate",
          },
          {
            label: "Teslim Tarihi",
            value: "deliveryDate",
          },
          {
            label: "Tedarikçi",
            value: "supplierName",
          },
          {
            label: "Belge No",
            value: "documentNumber",
          },
          {
            label: "Toplam Tutar",
            value: "totalAmount",
          },
          {
            label: "Kalem Sayısı",
            value: "itemCount",
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

    <div className="w-[125px]">
      <SelectInput
        label="Kayıt"
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
        setSelectedStatusCodes([]);
        setSortBy("supplyDate");
        setSortDirection("desc");
        setStatusFilter("");
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
      onClick={() => suppliesQuery.refetch()}
      disabled={suppliesQuery.isFetching}
      title="Tedarikleri yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          suppliesQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredSupplies.length} tedarik kaydı bulundu`}
>
  <DataTable
    columns={columns}
    data={filteredSupplies}
    loading={
      suppliesQuery.isLoading ||
      suppliersQuery.isLoading ||
      supplyStatuses.isLoading
    }
    emptyText="Tedarik kaydı bulunamadı."
    totalCount={filteredSupplies.length}
  />
</Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Tedarik"
        subtitle="Tedarikçi, belge ve satın alınacak malzemeleri tanımlayın."
        onClose={closeCreateDrawer}
        widthClassName="w-[1200px]"
      >
        {createMutation.isError && (
          <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {getErrorMessage(
              createMutation.error
            )}
          </div>
        )}

        <form
          onSubmit={submitSupply}
          className="space-y-5"
        >
          <Card title="Tedarik Bilgileri">
            <div className="grid grid-cols-4 gap-4 p-5">
              <SelectInput
                label="Tedarikçi"
                value={supplierId}
                onChange={handleSupplierChange}
                placeholder="Tedarikçi seçiniz"
                options={supplierOptions}
              />

              <TextInput
                label="Tedarik Tarihi"
                value={supplyDate}
                onChange={setSupplyDate}
                type="date"
                required
              />

              <SelectInput
                label="Tedarik Durumu"
                value={supplyStatus}
                onChange={setSupplyStatus}
                placeholder="Durum seçiniz"
                options={supplyStatuses.options}
              />
            </div>
          </Card>

          <Card
            title="Tedarik Kalemleri"
            headerRight={
              <button
                type="button"
                onClick={addLine}
                disabled={!supplierId}
                className="flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Satır Ekle
              </button>
            }
          >
            {!supplierId && (
              <div className="m-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                Malzeme seçeneklerini görmek için
                önce tedarikçi seçin.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      Malzeme / Teklif
                    </th>

                    <th className="px-3 py-3 text-left">
                      Hedef Depo
                    </th>

                    <th className="px-3 py-3 text-left">
                      Miktar
                    </th>

                    <th className="px-3 py-3 text-left">
                      Liste Fiyatı
                    </th>

                    <th className="px-3 py-3 text-left">
                      İşlem Fiyatı
                    </th>

                    <th className="px-3 py-3 text-left">
                      İskonto %
                    </th>

                    <th className="px-3 py-3 text-left">
                      KDV
                    </th>

                    <th className="px-3 py-3 text-left">
                      Toplam
                    </th>

                    <th className="px-3 py-3 text-center">
                      Sil
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((line) => {
                    const supplierMaterial =
                      getSupplierMaterial(line);

                    const calculation =
                      calculateLine(line);

                    return (
                      <tr
                        key={line.rowId}
                        className="border-t border-slate-100 align-top"
                      >
                        <td className="min-w-[280px] px-3 py-3">
                          <SelectInput
                            value={
                              line.supplierMaterialId
                            }
                            onChange={(value) =>
                              handleSupplierMaterialChange(
                                line.rowId,
                                value
                              )
                            }
                            placeholder="Malzeme seçin"
                            options={
                              supplierMaterialOptions
                            }
                            disabled={!supplierId}
                          />

                          {supplierMaterial && (
                            <div className="mt-2 text-xs leading-5 text-slate-500">
                              <p>
                                MOQ:{" "}
                                {supplierMaterial.moq ??
                                  "-"}{" "}
                                {
                                  supplierMaterial.materialUnitName
                                }
                              </p>

                              <p>
                                Termin:{" "}
                                {supplierMaterial.leadTimeDays ??
                                  "-"}{" "}
                                gün
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="min-w-[220px] px-3 py-3">
                          <SelectInput
                            value={
                              line.warehouseId
                            }
                            onChange={(value) =>
                              updateLine(
                                line.rowId,
                                "warehouseId",
                                value
                              )
                            }
                            placeholder="Depo seçin"
                            options={
                              warehouseOptions
                            }
                          />
                        </td>

                        <td className="min-w-[120px] px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(
                                line.rowId,
                                "quantity",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="min-w-[140px] px-3 py-3">
                          <div className="h-10 rounded-lg bg-slate-50 px-3 py-2.5 font-medium text-slate-600">
                            {supplierMaterial
                              ? formatMoney(
                                  supplierMaterial.listPrice,
                                  supplierMaterial.currencyName
                                )
                              : "-"}
                          </div>
                        </td>

                        <td className="min-w-[140px] px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(event) =>
                              updateLine(
                                line.rowId,
                                "unitPrice",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="min-w-[110px] px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              line.discountRate
                            }
                            onChange={(event) =>
                              updateLine(
                                line.rowId,
                                "discountRate",
                                event.target.value
                              )
                            }
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="min-w-[90px] px-3 py-3">
                          <div className="h-10 rounded-lg bg-slate-50 px-3 py-2.5 font-medium text-slate-600">
                            %
                            {
                              calculation.taxRate
                            }
                          </div>
                        </td>

                        <td className="min-w-[160px] px-3 py-3">
                          <div className="h-10 rounded-lg bg-emerald-50 px-3 py-2.5 font-bold text-emerald-700">
                            {formatMoney(
                              calculation.totalPrice,
                              supplierMaterial?.currencyName
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeLine(
                                line.rowId
                              )
                            }
                            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-slate-500">
                Net Toplam
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {createPreview.netAmount.toLocaleString(
                  "tr-TR",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-slate-500">
                Toplam KDV
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-700">
                {createPreview.taxAmount.toLocaleString(
                  "tr-TR",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </p>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-slate-500">
                Genel Toplam
              </p>

              <p className="mt-2 text-2xl font-bold text-indigo-700">
                {createPreview.totalAmount.toLocaleString(
                  "tr-TR",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </p>
            </Card>
          </div>

          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              !supplierId ||
              lines.length === 0
            }
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending
              ? "Kaydediliyor..."
              : "Tedariki Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedSupply)}
        title={
          selectedSupply?.documentNumber ??
          "Tedarik"
        }
        subtitle={
          selectedSupply
            ? selectedSupply.supplierName ??
              undefined
            : undefined
        }
        onClose={closeDetail}
        widthClassName="w-[950px]"
        headerRight={
          selectedSupply ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSupply.actions?.canPrint && (
                <button
                  type="button"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Yazdır
                </button>
              )}

              {selectedSupply.actions?.canAddItem && (
                <button
                  type="button"
                  className="h-10 rounded-xl bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Kalem Ekle
                </button>
              )}

              {selectedSupply.allowedTransitions?.map(
                (transition) => (
                  <button
                    key={transition.targetStatusCode}
                    type="button"
                    disabled={changeStatusMutation.isPending}
                    onClick={() =>
                      requestStatusTransition(
                        selectedSupply,
                        transition
                      )
                    }
                    className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {transition.actionName}
                  </button>
                )
              )}
            </div>
          ) : null
        }
      >
        {selectedSupply && (
          <>
            <DrawerTabs
              activeTab={activeDetailTab}
              onChange={(key) =>
                setActiveDetailTab(
                  key as SupplyDetailTab
                )
              }
              tabs={[
                {
                  key: "general",
                  label: "Genel Bilgiler",
                },
                {
                  key: "items",
                  label: "Kalemler",
                  count:
                    selectedSupply.supplyItems
                      ?.length ?? 0,
                },
                {
                  key: "history",
                  label: "Geçmiş",
                },
              ]}
            />

            {activeDetailTab ===
              "general" && (
              <SupplyGeneralTab
                supply={selectedSupply}
                statusParameter={
                  supplyStatuses.getByCode(
                    selectedSupply.supplyStatus
                  )
                }
              />
            )}

            {activeDetailTab === "items" && (
              <SupplyItemsTab
                items={
                  selectedSupply.supplyItems ??
                  []
                }
              />
            )}

            {activeDetailTab ===
              "history" && (
              <SupplyHistoryTab
                supply={selectedSupply}
              />
            )}
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(transitionTarget)}
        title={
          transitionTarget?.transition.actionName ??
          "Durum Değiştir"
        }
        description={
          transitionTarget
            ? `${transitionTarget.supply.documentNumber || `Tedarik #${transitionTarget.supply.id}`} kaydı "${transitionTarget.transition.statusName}" durumuna geçirilecek. İşlemi onaylıyor musunuz?`
            : ""
        }
        confirmText={
          transitionTarget?.transition.actionName ??
          "Onayla"
        }
        cancelText="İptal"
        loading={changeStatusMutation.isPending}
        variant="primary"
        onCancel={() => {
          setTransitionTarget(null);
          setTransitionDocumentNumber("");
          setTransitionNote("");
        }}
        onConfirm={() => {
          if (!transitionTarget) {
            return;
          }

          if (
            isDeliveryTransition &&
            !transitionDocumentNumber.trim()
          ) {
            return;
          }

          changeStatusMutation.mutate({
            supplyId: transitionTarget.supply.id,
            targetStatusCode:
              transitionTarget.transition.targetStatusCode,
            documentNumber: isDeliveryTransition
              ? transitionDocumentNumber.trim()
              : null,
            note: transitionNote.trim() || null,
          });
        }}
      >
        {isDeliveryTransition && (
          <TextInput
            label="İrsaliye Numarası"
            value={transitionDocumentNumber}
            onChange={setTransitionDocumentNumber}
            placeholder="İrsaliye numarasını girin"
            required
          />
        )}

        <TextInput
          label="Not"
          value={transitionNote}
          onChange={setTransitionNote}
          placeholder="İşlem notu girin"
        />
      </ConfirmDialog>
    </div>
  );
}

function SupplyGeneralTab({
  supply,
  statusParameter,
}: {
  supply: Supply;
  statusParameter?: {
    paramValue: string;
    badgeColor?: string | null;
  };
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Genel Toplam
          </p>

          <p className="mt-2 text-2xl font-bold text-indigo-700">
            {supply.totalAmount.toLocaleString(
              "tr-TR",
              {
                minimumFractionDigits: 2,
              }
            )}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Kalem Sayısı
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {supply.supplyItems?.length ?? 0}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Durum
          </p>

          <div className="mt-3">
            <StatusBadge
              text={
                statusParameter?.paramValue ??
                supply.supplyStatusName ??
                "Tanımsız"
              }
              color={
                statusParameter?.badgeColor ??
                "neutral"
              }
            />
          </div>
        </Card>
      </div>

      <Card title="Tedarik Bilgileri">
        <div className="grid grid-cols-2 gap-5 p-5 text-sm">
          <DetailItem
            label="Belge Numarası"
            value={supply.documentNumber!}
          />

          <DetailItem
            label="Tedarikçi"
            value={supply.supplierName ?? "-"}
          />

          <DetailItem
            label="Sorumlu Çalışan"
            value={supply.employeeName ?? "-"}
          />

          <DetailItem
            label="Tedarik Tarihi"
            value={formatDate(supply.supplyDate)}
          />

          <DetailItem
            label="Teslim Tarihi"
            value={
              supply.deliveryDate
                ? formatDate(
                    supply.deliveryDate
                  )
                : "-"
            }
          />

          <div>
            <p className="text-slate-400">
              Kayıt Durumu
            </p>

            <div className="mt-1">
              <ActiveStatusBadge
                isActive={supply.isActive}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SupplyItemsTab({
  items,
}: {
  items: NonNullable<Supply["supplyItems"]>;
}) {
  const totalNet = items.reduce(
    (total, item) =>
      total + (item.netAmount ?? 0),
    0
  );

  const totalTax = items.reduce(
    (total, item) =>
      total + (item.taxAmount ?? 0),
    0
  );

  const totalAmount = items.reduce(
    (total, item) =>
      total + item.totalPrice,
    0
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Net Toplam
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {totalNet.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            KDV Toplamı
          </p>

          <p className="mt-2 text-xl font-bold text-amber-700">
            {totalTax.toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Genel Toplam
          </p>

          <p className="mt-2 text-xl font-bold text-indigo-700">
            {totalAmount.toLocaleString(
              "tr-TR",
              {
                minimumFractionDigits: 2,
              }
            )}
          </p>
        </Card>
      </div>

      <Card title="Tedarik Kalemleri">
        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">
                  Malzeme
                </th>

                <th className="px-4 py-3 text-left">
                  Depo
                </th>

                <th className="px-4 py-3 text-left">
                  Miktar
                </th>

                <th className="px-4 py-3 text-left">
                  Liste Fiyatı
                </th>

                <th className="px-4 py-3 text-left">
                  İşlem Fiyatı
                </th>

                <th className="px-4 py-3 text-left">
                  İskonto
                </th>

                <th className="px-4 py-3 text-left">
                  KDV
                </th>

                <th className="px-4 py-3 text-left">
                  Toplam
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {item.materialName ?? "-"}
                    </p>

                    <p className="text-xs text-slate-400">
                      {item.materialCode ?? "-"}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {item.warehouseName ?? "-"}
                    </p>

                    <p className="text-xs text-slate-400">
                      {item.warehouseCode ?? "-"}
                    </p>
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {item.quantity.toLocaleString(
                      "tr-TR"
                    )}{" "}
                    {item.materialUnitName ?? ""}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {formatMoney(
                      item.listPrice,
                      item.currencyName
                    )}
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatMoney(
                      item.unitPrice,
                      item.currencyName
                    )}
                  </td>

                  <td className="px-4 py-3">
                    %{item.discountRate ?? 0}
                  </td>

                  <td className="px-4 py-3">
                    %{item.taxRate}
                  </td>

                  <td className="px-4 py-3 font-bold text-indigo-700">
                    {formatMoney(
                      item.totalPrice,
                      item.currencyName
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Tedarik kalemi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SupplyHistoryTab({
  supply,
}: {
  supply: Supply;
}) {
  return (
    <div className="space-y-4">
      <HistoryItem
        title="Tedarik oluşturuldu"
        description={`${supply.documentNumber} numaralı tedarik kaydı oluşturuldu.`}
        date={supply.supplyDate}
        color="info"
      />

      {supply.deliveryDate && (
        <HistoryItem
          title="Tedarik teslim alındı"
          description="Tedarik kalemleri depolara stok hareketi olarak eklendi."
          date={supply.deliveryDate}
          color="success"
        />
      )}
    </div>
  );
}

function HistoryItem({
  title,
  description,
  date,
  color,
}: {
  title: string;
  description: string;
  date: string;
  color: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 p-5">
      <div
        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
          color === "success"
            ? "bg-emerald-500"
            : "bg-blue-500"
        }`}
      />

      <div>
        <p className="font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

        <p className="mt-2 text-xs text-slate-400">
          {formatDate(date)}
        </p>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "tr-TR"
  );
}

function formatMoney(
  value: number,
  currency?: string | null
) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${currency ? ` ${currency}` : ""}`;
}