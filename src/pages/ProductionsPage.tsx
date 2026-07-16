import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import type { DragEndEvent } from "@dnd-kit/core";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CalendarDays,
  Columns3,
  Eye,
  Factory,
  List as ListIcon,
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
import MultiSelect from "../components/form/MultiSelect";

import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";
import DrawerTabs from "../components/drawer/DrawerTabs";

import ConfirmDialog from "../components/common/ConfirmDialog";
import StatusBadge from "../components/common/StatusBadge";
import ActiveStatusBadge from "../components/common/ActiveStatusBadge";

import { productionService, } from "../services/productionService";

import type {
  AllowedWorkflowTransition,
  Production,
  ProductionItem,
  ProductionProgress,
  WorkflowHistory,
} from "../services/productionService";

import { productService } from "../services/productService";
import { materialService } from "../services/materialService";
import { warehouseService } from "../services/warehouseService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

type ViewMode = "list" | "board";

type ProductionDetailTab =
  | "general"
  | "materials"
  | "progress"
  | "workflow";

interface ProductionPlanLine {
  rowId: string;
  materialId: string;
  sourceWarehouseId: string;
  plannedQuantity: string;
}

interface TransitionTarget {
  production: Production;
  transition: AllowedWorkflowTransition;
}

interface CompletionItemValue {
  actualQuantity: string;
  scrapQuantity: string;
}

function createEmptyPlanLine(): ProductionPlanLine {
  return {
    rowId: crypto.randomUUID(),
    materialId: "",
    sourceWarehouseId: "",
    plannedQuantity: "",
  };
}

export default function ProductionsPage() {
  const queryClient = useQueryClient();

  const productionStatuses =
    useParameterOptions("ProductionStatus", 1);

  const [viewMode, setViewMode] =
    useState<ViewMode>("board");

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [selectedProduction, setSelectedProduction] =
    useState<Production | null>(null);

  const [activeDetailTab, setActiveDetailTab] =
    useState<ProductionDetailTab>("general");

  const [transitionTarget, setTransitionTarget] =
    useState<TransitionTarget | null>(null);

  // Create alanları
  const [productId, setProductId] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] =
    useState("");

  const [plannedQuantity, setPlannedQuantity] =
    useState("");

  const [productionDate, setProductionDate] =
    useState(
      new Date().toISOString().slice(0, 10)
    );

  const [planLines, setPlanLines] = useState<
    ProductionPlanLine[]
  >([createEmptyPlanLine()]);

  // Tamamlama alanları
  const [completionItems, setCompletionItems] =
    useState<Record<number, CompletionItemValue>>(
      {}
    );

  const [progressTarget, setProgressTarget] =
    useState<Production | null>(null);

  const [progressQuantity, setProgressQuantity] =
    useState("");

  const [progressNote, setProgressNote] =
    useState("");

  const [transitionNote, setTransitionNote] =
    useState("");

  // Filtreler
  const [selectedProductIds, setSelectedProductIds] =
    useState<string[]>([]);

  const [selectedStatusCodes, setSelectedStatusCodes] =
    useState<string[]>([]);

  const [
    selectedWarehouseIds,
    setSelectedWarehouseIds,
  ] = useState<string[]>([]);

  const [searchText, setSearchText] = useState("");

  const [sortBy, setSortBy] =
    useState("productionDate");

  const [sortDirection, setSortDirection] =
    useState("desc");

  const productionsQuery = useQuery({
    queryKey: ["productions"],
    queryFn: () =>
      productionService.getList({
        isDeleted: false,
      }),
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productService.getList,
  });

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: materialService.getList,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const productions =
    productionsQuery.data ?? [];

  const products = productsQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const productOptions = useMemo(
    () =>
      products
        .filter((item) => item.isActive)
        .map((item) => ({
          label: `${item.name} (${item.code})`,
          value: String(item.id),
        })),
    [products]
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

  const resetPlanForm = () => {
    setProductId("");
    setTargetWarehouseId("");
    setPlannedQuantity("");

    setProductionDate(
      new Date().toISOString().slice(0, 10)
    );

    setPlanLines([createEmptyPlanLine()]);
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    resetPlanForm();
    planMutation.reset();
  };

  const openDetail = (production: Production) => {
    setSelectedProduction(production);
    setActiveDetailTab("general");
  };

  const closeDetail = () => {
    setSelectedProduction(null);
    setActiveDetailTab("general");
  };

  const clearTransitionForm = () => {
    setTransitionTarget(null);
    setTransitionNote("");
    setCompletionItems({});
  };

  const planMutation = useMutation({
    mutationFn: productionService.plan,

    onSuccess: async () => {
      closeCreateDrawer();

      await queryClient.invalidateQueries({
        queryKey: ["productions"],
      });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: productionService.changeStatus,

    onSuccess: async (_, variables) => {
      const changedProductionId =
        variables.productionId;

      clearTransitionForm();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["productions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["material-warehouses"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["product-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "product-stock-movements",
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["products"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["materials"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["warehouses"],
        }),
      ]);

      const refreshedResult =
        await productionsQuery.refetch();

      const updatedProduction =
        refreshedResult.data?.find(
          (item) =>
            item.id === changedProductionId
        );

      setSelectedProduction(
        updatedProduction ?? null
      );
    },
  });

  const addProgressMutation = useMutation({
  mutationFn: productionService.addProgress,

  onSuccess: async (_, variables) => {
    const productionId = variables.productionId;

    setProgressTarget(null);
    setProgressQuantity("");
    setProgressNote("");

    await queryClient.invalidateQueries({
      queryKey: ["productions"],
    });

    const refreshedResult =
      await productionsQuery.refetch();

    const updatedProduction =
      refreshedResult.data?.find(
        (production) =>
          production.id === productionId
      );

    setSelectedProduction(
      updatedProduction ?? null
    );

    if (updatedProduction) {
  setActiveDetailTab("progress");
    }
  },
});

  const addPlanLine = () => {
    setPlanLines((previous) => [
      ...previous,
      createEmptyPlanLine(),
    ]);
  };

  const removePlanLine = (rowId: string) => {
    setPlanLines((previous) => {
      const result = previous.filter(
        (line) => line.rowId !== rowId
      );

      return result.length > 0
        ? result
        : [createEmptyPlanLine()];
    });
  };

  const updatePlanLine = (
    rowId: string,
    field: keyof Omit<
      ProductionPlanLine,
      "rowId"
    >,
    value: string
  ) => {
    setPlanLines((previous) =>
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

  const submitProductionPlan = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !productId ||
      !targetWarehouseId ||
      !plannedQuantity ||
      !productionDate
    ) {
      return;
    }

    const validLines = planLines.filter(
      (line) =>
        line.materialId &&
        line.sourceWarehouseId &&
        Number(line.plannedQuantity) > 0
    );

    if (validLines.length === 0) {
      return;
    }

    planMutation.mutate({
      productId: Number(productId),

      targetWarehouseId: Number(
        targetWarehouseId
      ),

      plannedQuantity: Number(
        plannedQuantity
      ),

      productionDate: `${productionDate}T00:00:00`,

      productionItems: validLines.map(
        (line) => ({
          materialId: Number(
            line.materialId
          ),

          sourceWarehouseId: Number(
            line.sourceWarehouseId
          ),

          plannedQuantity: Number(
            line.plannedQuantity
          ),
        })
      ),
    });
  };

  const requestTransition = (
    production: Production,
    transition: AllowedWorkflowTransition
  ) => {
    const shortCode =
      transition.statusShortCode
        ?.trim()
        .toLocaleLowerCase("tr-TR");

    if (shortCode === "completed") {
      const initialItems: Record<
        number,
        CompletionItemValue
      > = {};

      production.productionItems.forEach(
        (item) => {
          initialItems[item.id] = {
            actualQuantity: String(
              item.plannedQuantity
            ),
            scrapQuantity: "0",
          };
        }
      );

      setCompletionItems(initialItems);
    }

    setTransitionTarget({
      production,
      transition,
    });
  };

  const isCompletionTransition =
    transitionTarget?.transition.statusShortCode
      ?.trim()
      .toLocaleLowerCase("tr-TR") ===
    "completed";

  const submitTransition = () => {
    if (!transitionTarget) {
      return;
    }

    if (isCompletionTransition) {
      const productionItems =
        transitionTarget.production.productionItems.map(
          (item) => ({
            productionItemId: item.id,
            actualQuantity: Number(
              completionItems[item.id]
                ?.actualQuantity ?? 0
            ),
            scrapQuantity: Number(
              completionItems[item.id]
                ?.scrapQuantity ?? 0
            ),
          })
        );

      changeStatusMutation.mutate({
        productionId:
          transitionTarget.production.id,

        targetStatusCode:
          transitionTarget.transition
            .targetStatusCode,

        productionItems,
        note: transitionNote.trim() || null,
      });

      return;
    }

    changeStatusMutation.mutate({
      productionId:
        transitionTarget.production.id,

      targetStatusCode:
        transitionTarget.transition
          .targetStatusCode,

      actualQuantity: transitionTarget.production.actualQuantity ?? null,
      productionItems: null,
      note: transitionNote.trim() || null,
    });
  };

  const openProgressDialog = (
  production: Production
) => {
  setProgressTarget(production);
  setProgressQuantity("");
  setProgressNote("");
};

const closeProgressDialog = () => {
  setProgressTarget(null);
  setProgressQuantity("");
  setProgressNote("");
  addProgressMutation.reset();
};

const submitProgress = () => {
  if (!progressTarget) {
    return;
  }

  const quantity = Number(progressQuantity);

  if (quantity <= 0) {
    return;
  }

  addProgressMutation.mutate({
    productionId: progressTarget.id,
    producedQuantity: quantity,
    note: progressNote.trim() || null,
  });
};

const canAddProgress = (
  production: Production
) => {
  const status =
    production.productionStatusShortCode
      ?.trim()
      .toLocaleLowerCase("tr-TR");

  return (
    status === "started"
  );
};

  const updateCompletionItem = (
    productionItemId: number,
    field: keyof CompletionItemValue,
    value: string
  ) => {
    setCompletionItems((previous) => ({
      ...previous,

      [productionItemId]: {
        actualQuantity:
          previous[productionItemId]
            ?.actualQuantity ?? "0",

        scrapQuantity:
          previous[productionItemId]
            ?.scrapQuantity ?? "0",

        [field]: value,
      },
    }));
  };

  const clearFilters = () => {
    setSelectedProductIds([]);
    setSelectedStatusCodes([]);
    setSelectedWarehouseIds([]);
    setSearchText("");
    setSortBy("productionDate");
    setSortDirection("desc");
  };

  const filteredProductions = useMemo(() => {
    let result = [...productions];

    if (searchText.trim()) {
      const search = searchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      result = result.filter(
        (production) =>
          production.productName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          production.productCode
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          production.targetWarehouseName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          production.productionStatusName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (selectedProductIds.length > 0) {
      result = result.filter((production) =>
        selectedProductIds.includes(
          String(production.productId)
        )
      );
    }

    if (selectedStatusCodes.length > 0) {
      result = result.filter(
        (production) =>
          production.productionStatus != null &&
          selectedStatusCodes.includes(
            String(
              production.productionStatus
            )
          )
      );
    }

    if (selectedWarehouseIds.length > 0) {
      result = result.filter((production) =>
        selectedWarehouseIds.includes(
          String(
            production.targetWarehouseId
          )
        )
      );
    }

    result.sort((first, second) => {
      let compareResult = 0;

      if (sortBy === "productionDate") {
        compareResult =
          new Date(
            first.productionDate
          ).getTime() -
          new Date(
            second.productionDate
          ).getTime();
      }

      if (sortBy === "productName") {
        compareResult = (
          first.productName ?? ""
        ).localeCompare(
          second.productName ?? "",
          "tr"
        );
      }

      if (sortBy === "plannedQuantity") {
        compareResult =
          first.plannedQuantity -
          second.plannedQuantity;
      }

      if (sortBy === "actualQuantity") {
        compareResult =
          (first.actualQuantity ?? 0) -
          (second.actualQuantity ?? 0);
      }

      return sortDirection === "asc"
        ? compareResult
        : -compareResult;
    });

    return result;
  }, [
    productions,
    searchText,
    selectedProductIds,
    selectedStatusCodes,
    selectedWarehouseIds,
    sortBy,
    sortDirection,
  ]);

  const statusColumns = useMemo(() => {
    if (productionStatuses.data?.length) {
      return [...productionStatuses.data]
        .sort(
          (first, second) =>
            (first.displayOrder ?? 0) -
            (second.displayOrder ?? 0)
        )
        .map((status) => ({
          code: Number(status.paramCode),
          name: status.paramValue,
          shortCode: status.shortCode,
          badgeColor: status.badgeColor,
        }));
    }

    const map = new Map<
      number,
      {
        code: number;
        name: string;
        shortCode?: string | null;
        badgeColor?: string | null;
      }
    >();

    productions.forEach((production) => {
      if (
        production.productionStatus != null
      ) {
        map.set(
          production.productionStatus,
          {
            code:
              production.productionStatus,

            name:
              production.productionStatusName ??
              "Tanımsız",

            shortCode:
              production.productionStatusShortCode,

            badgeColor:
              production.productionStatusBadgeColor,
          }
        );
      }
    });

    return Array.from(map.values()).sort(
      (first, second) =>
        first.code - second.code
    );
  }, [
    productions,
    productionStatuses.data,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const handleDragEnd = (
    event: DragEndEvent
  ) => {
    const draggedProductionId = Number(
      event.active.id
    );

    const targetStatusCode = Number(
      event.over?.id
    );

    if (
      !draggedProductionId ||
      !targetStatusCode
    ) {
      return;
    }

    const production = productions.find(
      (item) =>
        item.id === draggedProductionId
    );

    if (
      !production ||
      production.productionStatus ===
        targetStatusCode
    ) {
      return;
    }

    const transition =
      production.allowedTransitions?.find(
        (item) =>
          item.targetStatusCode ===
          targetStatusCode
      );

    if (!transition) {
      return;
    }

    requestTransition(
      production,
      transition
    );
  };

  const columns: DataTableColumn<Production>[] =
    [
      {
        header: "Ürün",

        render: (production) => (
          <button
            type="button"
            onClick={() =>
              openDetail(production)
            }
            className="text-left"
          >
            <p className="font-semibold text-slate-800 hover:text-indigo-600">
              {production.productName ?? "-"}
            </p>

            <p className="text-xs text-slate-400">
              {production.productCode ??
                `Üretim #${production.id}`}
            </p>
          </button>
        ),

        filter: null,
      },
      {
        header: "Durum",

        render: (production) => (
          <StatusBadge
            text={
              production.productionStatusName ??
              "Tanımsız"
            }
            color={
              production.productionStatusBadgeColor ??
              "neutral"
            }
          />
        ),

        filter: null,
      },
      {
        header: "Planlanan",

        render: (production) => (
          <span className="font-semibold text-slate-800">
            {production.plannedQuantity.toLocaleString(
              "tr-TR"
            )}
          </span>
        ),

        filter: null,
      },
      {
        header: "Gerçekleşen",

        render: (production) => (
          <span className="font-semibold text-slate-800">
            {(
              production.actualQuantity ?? 0
            ).toLocaleString("tr-TR")}
          </span>
        ),

        filter: null,
      },
      {
        header: "Hedef Depo",

        render: (production) => (
          <div>
            <p className="font-medium text-slate-800">
              {production.targetWarehouseName ??
                "-"}
            </p>

            <p className="text-xs text-slate-400">
              {production.targetWarehouseCode ??
                "-"}
            </p>
          </div>
        ),

        filter: null,
      },
      {
        header: "Planlanan Tarih",

        render: (production) =>
          formatDate(
            production.productionDate
          ),

        filter: null,
      },
      {
        header: "Malzeme",

        render: (production) => (
          <button
            type="button"
            onClick={() => {
              setSelectedProduction(production);
              setActiveDetailTab("materials");
            }}
            className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100"
          >
            {production.productionItems?.length ??
              0}{" "}
            Kalem
          </button>
        ),

        filter: null,
      },
      {
        header: "Kayıt",

        render: (production) => (
          <ActiveStatusBadge
            isActive={production.isActive}
          />
        ),

        filter: null,
      },
      {
        header: "İşlemler",

        render: (production) => (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="Detay"
              onClick={() =>
                openDetail(production)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
            >
              <Eye size={16} />
            </button>

            {canAddProgress(production) && (
  <button
    type="button"
    title="İlerleme Ekle"
    onClick={() =>
      openProgressDialog(production)
    }
    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
  >
    + İlerleme
  </button>
)}

            {production.allowedTransitions?.map(
              (transition) => (
                <button
                  key={
                    transition.targetStatusCode
                  }
                  type="button"
                  disabled={
                    changeStatusMutation.isPending
                  }
                  onClick={() =>
                    requestTransition(
                      production,
                      transition
                    )
                  }
                  className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {transition.actionName}
                </button>
              )
            )}
          </div>
        ),

        filter: null,
      },
    ];

  return (
    <div>
      <PageHeader
        title="Üretim Yönetimi"
        moduleName="Üretim"
        description="Üretim planlarını liste veya Kanban görünümünde yönetin."
        rightContent={
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() =>
                  setViewMode("list")
                }
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ListIcon size={16} />
                Liste
              </button>

              <button
                type="button"
                onClick={() =>
                  setViewMode("board")
                }
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                  viewMode === "board"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Columns3 size={16} />
                Kanban
              </button>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <X size={18} />
              Temizle
            </button>

            <button
              type="button"
              onClick={() =>
                setShowCreateDrawer(true)
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Üretim Planı
            </button>
          </div>
        }
      />

      {productionsQuery.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {getErrorMessage(
            productionsQuery.error
          )}
        </div>
      )}

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-3 gap-4">
          <MultiSelect
            label="Ürünler"
            values={selectedProductIds}
            onChange={setSelectedProductIds}
            placeholder="Ürün seçin"
            options={productOptions}
          />

          <MultiSelect
            label="Durumlar"
            values={selectedStatusCodes}
            onChange={
              setSelectedStatusCodes
            }
            placeholder="Durum seçin"
            options={
              productionStatuses.options
            }
          />

          <MultiSelect
            label="Hedef Depolar"
            values={selectedWarehouseIds}
            onChange={
              setSelectedWarehouseIds
            }
            placeholder="Depo seçin"
            options={warehouseOptions}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <SelectInput
            label="Sırala"
            value={sortBy}
            onChange={setSortBy}
            options={[
              {
                label: "Üretim Tarihi",
                value: "productionDate",
              },
              {
                label: "Ürün",
                value: "productName",
              },
              {
                label: "Planlanan Miktar",
                value: "plannedQuantity",
              },
              {
                label: "Gerçekleşen Miktar",
                value: "actualQuantity",
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
                size={18}
                className="absolute right-3 top-3 text-slate-400"
              />

              <input
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder="Ürün, depo veya durum..."
                className="h-11 w-full rounded-xl border border-slate-200 px-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {viewMode === "list" && (
        <Card
          title={`Toplam ${filteredProductions.length} üretim kaydı`}
          headerRight={
            <button
              type="button"
              onClick={() =>
                productionsQuery.refetch()
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={17} />
              Yenile
            </button>
          }
        >
          <DataTable
            columns={columns}
            data={filteredProductions}
            loading={
              productionsQuery.isLoading
            }
            emptyText="Üretim kaydı bulunamadı."
            totalCount={
              filteredProductions.length
            }
          />
        </Card>
      )}

      {viewMode === "board" && (
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 overflow-x-auto pb-5">
            {statusColumns.map((status) => (
              <ProductionKanbanColumn
                key={status.code}
                statusCode={status.code}
                title={status.name}
                productions={filteredProductions.filter(
                  (production) =>
                    production.productionStatus ===
                    status.code
                )}
                onOpen={openDetail}
              />
            ))}
          </div>
        </DndContext>
      )}

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Üretim Planı"
        subtitle="Ürün, hedef depo ve hammadde ihtiyaçlarını tanımlayın."
        onClose={closeCreateDrawer}
        widthClassName="w-[1100px]"
      >
        {planMutation.isError && (
          <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {getErrorMessage(
              planMutation.error
            )}
          </div>
        )}

        <form
          onSubmit={submitProductionPlan}
          className="space-y-5"
        >
          <Card title="Üretim Bilgileri">
            <div className="grid grid-cols-4 gap-4 p-5">
              <SelectInput
                label="Üretilecek Ürün"
                value={productId}
                onChange={setProductId}
                placeholder="Ürün seçin"
                options={productOptions}
              />

              <TextInput
                label="Planlanan Miktar"
                value={plannedQuantity}
                onChange={
                  setPlannedQuantity
                }
                type="number"
                required
              />

              <SelectInput
                label="Hedef Depo"
                value={targetWarehouseId}
                onChange={
                  setTargetWarehouseId
                }
                placeholder="Depo seçin"
                options={warehouseOptions}
              />

              <TextInput
                label="Planlanan Tarih"
                value={productionDate}
                onChange={setProductionDate}
                type="date"
                required
              />
            </div>
          </Card>

          <Card
            title="Hammadde Planı"
            headerRight={
              <button
                type="button"
                onClick={addPlanLine}
                className="flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={16} />
                Satır Ekle
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Malzeme
                    </th>

                    <th className="px-4 py-3 text-left">
                      Kaynak Depo
                    </th>

                    <th className="px-4 py-3 text-left">
                      Planlanan Miktar
                    </th>

                    <th className="px-4 py-3 text-center">
                      Sil
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {planLines.map((line) => (
                    <tr
                      key={line.rowId}
                      className="border-t border-slate-100"
                    >
                      <td className="min-w-[280px] px-4 py-3">
                        <SelectInput
                          value={line.materialId}
                          onChange={(value) =>
                            updatePlanLine(
                              line.rowId,
                              "materialId",
                              value
                            )
                          }
                          placeholder="Malzeme seçin"
                          options={materialOptions}
                        />
                      </td>

                      <td className="min-w-[260px] px-4 py-3">
                        <SelectInput
                          value={
                            line.sourceWarehouseId
                          }
                          onChange={(value) =>
                            updatePlanLine(
                              line.rowId,
                              "sourceWarehouseId",
                              value
                            )
                          }
                          placeholder="Depo seçin"
                          options={warehouseOptions}
                        />
                      </td>

                      <td className="min-w-[180px] px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={
                            line.plannedQuantity
                          }
                          onChange={(event) =>
                            updatePlanLine(
                              line.rowId,
                              "plannedQuantity",
                              event.target.value
                            )
                          }
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            removePlanLine(
                              line.rowId
                            )
                          }
                          className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <button
            type="submit"
            disabled={planMutation.isPending}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {planMutation.isPending
              ? "Kaydediliyor..."
              : "Üretim Planını Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedProduction)}
        title={
          selectedProduction?.productName ??
          "Üretim Detayı"
        }
        subtitle={
          selectedProduction
            ? selectedProduction.productCode ??
              `Üretim #${selectedProduction.id}`
            : undefined
        }
        onClose={closeDetail}
        widthClassName="w-[900px]"
        headerRight={
          selectedProduction ? (
            <div className="flex flex-wrap gap-2">
                {canAddProgress(selectedProduction) && (
  <button
    type="button"
    onClick={() =>
      openProgressDialog(
        selectedProduction
      )
    }
    className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
  >
    + İlerleme Ekle
  </button>
)}
              {selectedProduction.allowedTransitions?.map(
                (transition) => (
                  <button
                    key={
                      transition.targetStatusCode
                    }
                    type="button"
                    onClick={() =>
                      requestTransition(
                        selectedProduction,
                        transition
                      )
                    }
                    className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    {transition.actionName}
                  </button>
                )
              )}
            </div>
          ) : null
        }
      >
        {selectedProduction && (
          <>
            <DrawerTabs
            activeTab={activeDetailTab}
            onChange={(key) =>
                setActiveDetailTab(key as ProductionDetailTab)
            }
            tabs={[
                {
                key: "general",
                label: "Genel Bilgiler",
                },
                {
                key: "materials",
                label: "Hammaddeler",
                count: selectedProduction.productionItems?.length ?? 0,
                },
                {
                key: "progress",
                label: "İlerleme Geçmişi",
                count: selectedProduction.productionProgresses?.length ?? 0,
                },
                {
                key: "workflow",
                label: "İş Akışı",
                },
            ]}
            />

            {activeDetailTab === "general" && (
              <ProductionGeneralTab
                production={
                  selectedProduction
                }
              />
            )}

            {activeDetailTab ===
              "materials" && (
              <ProductionMaterialsTab
                items={
                  selectedProduction.productionItems ??
                  []
                }
              />
            )}

            {activeDetailTab === "progress" && (
            <ProductionProgressTab
                production={selectedProduction}
                progresses={selectedProduction.productionProgresses ?? []}
            />
            )}

            {activeDetailTab ===
              "workflow" && (
              <ProductionWorkflowTab
                production={
                  selectedProduction
                }
              />
            )}
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(transitionTarget)}
        title={
          transitionTarget?.transition
            .actionName ?? "Durum Değiştir"
        }
        description={
          transitionTarget
            ? `${transitionTarget.production.productName ?? "Üretim"} kaydı "${transitionTarget.transition.statusName}" durumuna geçirilecek.`
            : ""
        }
        confirmText={
          transitionTarget?.transition
            .actionName ?? "Onayla"
        }
        cancelText="İptal"
        loading={
          changeStatusMutation.isPending
        }
        variant="primary"
        onCancel={clearTransitionForm}
        onConfirm={submitTransition}
      >
        {addProgressMutation.isError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {getErrorMessage(
                addProgressMutation.error
                )}
            </div>
            )}
        {isCompletionTransition && (
          <>
            
            <div className="max-h-[360px] space-y-3 overflow-y-auto">
              {transitionTarget?.production.productionItems.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {item.materialName ??
                        "Malzeme"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Planlanan:{" "}
                      {item.plannedQuantity}{" "}
                      {item.materialUnitName ?? ""}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <TextInput
                        label="Gerçek Kullanım"
                        value={
                          completionItems[
                            item.id
                          ]?.actualQuantity ??
                          ""
                        }
                        onChange={(value) =>
                          updateCompletionItem(
                            item.id,
                            "actualQuantity",
                            value
                          )
                        }
                        type="number"
                      />

                      <TextInput
                        label="Fire"
                        value={
                          completionItems[
                            item.id
                          ]?.scrapQuantity ??
                          ""
                        }
                        onChange={(value) =>
                          updateCompletionItem(
                            item.id,
                            "scrapQuantity",
                            value
                          )
                        }
                        type="number"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}

        <TextInput
          label="İşlem Notu"
          value={transitionNote}
          onChange={setTransitionNote}
          placeholder="İsteğe bağlı not..."
        />
      </ConfirmDialog>

      <ConfirmDialog
  open={Boolean(progressTarget)}
  title="Üretim İlerlemesi Ekle"
  description={
    progressTarget
      ? `${progressTarget.productName ?? "Üretim"} için yeni gerçekleşen miktar kaydı girin. Bu işlem üretimi tamamlamaz.`
      : ""
  }
  confirmText="İlerlemeyi Kaydet"
  cancelText="İptal"
  loading={addProgressMutation.isPending}
  variant="primary"
  onCancel={closeProgressDialog}
  onConfirm={submitProgress}
>
  {addProgressMutation.isError && (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
      {getErrorMessage(
        addProgressMutation.error
      )}
    </div>
  )}

  {progressTarget && (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-400">
          Planlanan
        </p>

        <p className="mt-1 text-xl font-bold text-slate-800">
          {progressTarget.plannedQuantity.toLocaleString(
            "tr-TR"
          )}
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 p-4">
        <p className="text-xs text-indigo-400">
          Şu Ana Kadar Üretilen
        </p>

        <p className="mt-1 text-xl font-bold text-indigo-700">
          {(
            progressTarget.actualQuantity ?? 0
          ).toLocaleString("tr-TR")}
        </p>
      </div>
    </div>
  )}

  <TextInput
    label="Bu Kaydıyla Üretilen Miktar"
    value={progressQuantity}
    onChange={setProgressQuantity}
    type="number"
    placeholder="Örn: 25"
    required
  />

  <TextInput
    label="İşlem Notu"
    value={progressNote}
    onChange={setProgressNote}
    placeholder="Vardiya veya üretim notu..."
  />
</ConfirmDialog>
    </div>
  );
}

function ProductionKanbanColumn({
  statusCode,
  title,
  productions,
  onOpen,
}: {
  statusCode: number;
  title: string;
  productions: Production[];
  onOpen: (production: Production) => void;
}) {
  const { setNodeRef, isOver } =
    useDroppable({
      id: statusCode,
    });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[620px] min-w-[310px] flex-1 rounded-2xl border p-4 transition ${
        isOver
          ? "border-indigo-300 bg-indigo-50"
          : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">
          {title}
        </h3>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
          {productions.length}
        </span>
      </div>

      <div className="space-y-3">
        {productions.map((production) => (
          <ProductionKanbanCard
            key={production.id}
            production={production}
            onOpen={onOpen}
          />
        ))}

        {productions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Bu durumda üretim kaydı yok.
          </div>
        )}
      </div>
    </section>
  );
}

function ProductionKanbanCard({
  production,
  onOpen,
}: {
  production: Production;
  onOpen: (production: Production) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: production.id,
  });

  const progress =
    production.plannedQuantity > 0
      ? Math.min(
          100,
          ((production.actualQuantity ?? 0) /
            production.plannedQuantity) *
            100
        )
      : 0;

  const activeReservationCount =
  production.productionItems?.filter(
    (item) =>
      !item.reservationReleased &&
      (item.reservedQuantity ?? 0) -
        (item.consumedQuantity ?? 0) >
        0
  ).length ?? 0;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md ${
        isDragging
          ? "z-50 opacity-70 shadow-xl"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onPointerDown={(event) =>
            event.stopPropagation()
          }
          onClick={() => onOpen(production)}
          className="text-left"
        >
          <p className="font-bold text-slate-900">
            {production.productName ??
              "Ürün"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {production.productCode ??
              `Üretim #${production.id}`}
          </p>
        </button>

        <Factory
          size={19}
          className="text-indigo-600"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Planlanan
          </p>

          <p className="mt-1 font-bold text-slate-800">
            {production.plannedQuantity.toLocaleString(
              "tr-TR"
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Gerçekleşen
          </p>

          <p className="mt-1 font-bold text-slate-800">
            {(
              production.actualQuantity ?? 0
            ).toLocaleString("tr-TR")}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            İlerleme
          </span>

          <span className="font-semibold text-slate-600">
            %{progress.toFixed(0)}
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
  <span className="text-xs font-medium text-amber-600">
    Aktif rezervasyon
  </span>

  <span className="text-sm font-bold text-amber-700">
    {activeReservationCount} malzeme
  </span>
</div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <WarehouseIcon size={15} />

        <span>
          {production.targetWarehouseName ??
            "-"}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <CalendarDays size={15} />

        <span>
          {formatDate(
            production.productionDate
          )}
        </span>
      </div>
    </article>
  );
}

function ProductionGeneralTab({
  production,
}: {
  production: Production;
}) {
  const progress =
    production.plannedQuantity > 0
      ? Math.min(
          100,
          ((production.actualQuantity ?? 0) /
            production.plannedQuantity) *
            100
        )
      : 0;

const activeReservationCount =
  production.productionItems.filter(
    (item) =>
      !item.reservationReleased &&
      (item.reservedQuantity ?? 0) -
        (item.consumedQuantity ?? 0) >
        0
  ).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Planlanan
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {production.plannedQuantity.toLocaleString(
              "tr-TR"
            )}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Gerçekleşen
          </p>

          <p className="mt-2 text-2xl font-bold text-indigo-700">
            {(
              production.actualQuantity ?? 0
            ).toLocaleString("tr-TR")}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Durum
          </p>

          <div className="mt-3">
            <StatusBadge
              text={
                production.productionStatusName ??
                "Tanımsız"
              }
              color={
                production.productionStatusBadgeColor ??
                "neutral"
              }
            />
          </div>
        </Card>
      </div>

      <Card title="Üretim Bilgileri">
        <div className="grid grid-cols-2 gap-5 p-5 text-sm">
          <DetailItem
            label="Ürün"
            value={
              production.productName ?? "-"
            }
          />

          <DetailItem
            label="Ürün Kodu"
            value={
              production.productCode ?? "-"
            }
          />

          <DetailItem
            label="Hedef Depo"
            value={
              production.targetWarehouseName ??
              "-"
            }
          />

          <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2">
            <span className="text-xs font-medium text-amber-600">
                Aktif rezervasyon
            </span>

            <span className="text-sm font-bold text-amber-700">
                {activeReservationCount} malzeme
            </span>
            </div>

          <DetailItem
            label="Planlanan Tarih"
            value={formatDate(
              production.productionDate
            )}
          />

          <DetailItem
            label="Başlama Tarihi"
            value={
              production.startedDate
                ? formatDateTime(
                    production.startedDate
                  )
                : "-"
            }
          />

          <DetailItem
            label="Tamamlanma Tarihi"
            value={
              production.completedDate
                ? formatDateTime(
                    production.completedDate
                  )
                : "-"
            }
          />
        </div>
      </Card>

      <Card title="İlerleme">
        <div className="p-5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">
              Üretim ilerlemesi
            </span>

            <span className="font-bold text-slate-800">
              %{progress.toFixed(0)}
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProductionMaterialsTab({
  items,
}: {
  items: ProductionItem[];
}) {
  return (
    <Card title="Üretim Hammaddeleri">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
                <th className="px-4 py-3 text-left">
                Malzeme
                </th>

                <th className="px-4 py-3 text-left">
                Kaynak Depo
                </th>

                <th className="px-4 py-3 text-right">
                Planlanan
                </th>

                <th className="px-4 py-3 text-right">
                Rezerve
                </th>

                <th className="px-4 py-3 text-right">
                Tüketilen
                </th>

                <th className="px-4 py-3 text-right">
                Gerçek Kullanım
                </th>

                <th className="px-4 py-3 text-right">
                Fire
                </th>

                <th className="px-4 py-3 text-center">
                Rezervasyon
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
          {item.sourceWarehouseName ?? "-"}
        </p>

        <p className="text-xs text-slate-400">
          {item.sourceWarehouseCode ?? "-"}
        </p>
      </td>

      <td className="px-4 py-3 text-right font-semibold">
        {item.plannedQuantity.toLocaleString(
          "tr-TR"
        )}
      </td>

      <td className="px-4 py-3 text-right font-semibold text-amber-700">
        {(item.reservedQuantity ?? 0).toLocaleString(
          "tr-TR"
        )}
      </td>

      <td className="px-4 py-3 text-right font-semibold text-blue-700">
        {(item.consumedQuantity ?? 0).toLocaleString(
          "tr-TR"
        )}
      </td>

      <td className="px-4 py-3 text-right font-semibold text-indigo-700">
        {item.actualQuantity?.toLocaleString(
          "tr-TR"
        ) ?? "-"}
      </td>

      <td className="px-4 py-3 text-right font-semibold text-red-600">
        {(item.scrapQuantity ?? 0).toLocaleString(
          "tr-TR"
        )}
      </td>

      <td className="px-4 py-3 text-center">
        {item.reservationReleased ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Kapandı
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Aktif
          </span>
        )}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </Card>
  );
}

function ProductionProgressTab({
  production,
  progresses,
}: {
  production: Production;
  progresses: ProductionProgress[];
}) {
  const plannedQuantity = production.plannedQuantity;
  const actualQuantity = production.actualQuantity ?? 0;

  const progressPercentage =
    plannedQuantity > 0
      ? (actualQuantity / plannedQuantity) * 100
      : 0;

  const totalScrap = production.productionItems.reduce(
    (total, item) => total + (item.scrapQuantity ?? 0),
    0
  );

  const totalMaterialUsage = production.productionItems.reduce(
    (total, item) => total + (item.actualQuantity ?? 0),
    0
  );

  const activeReservationCount =
  production.productionItems.filter(
    (item) =>
      !item.reservationReleased &&
      (item.reservedQuantity ?? 0) -
        (item.consumedQuantity ?? 0) >
        0
  ).length;

  const scrapRate =
    totalMaterialUsage + totalScrap > 0
      ? (totalScrap / (totalMaterialUsage + totalScrap)) * 100
      : 0;

  const sortedProgresses = [...progresses].sort(
    (first, second) =>
      new Date(second.progressDate).getTime() -
      new Date(first.progressDate).getTime()
  );

  const lastProgress = sortedProgresses[0];

  return (
    <div className="space-y-5">
      <Card title="Üretim İlerlemesi">
        <div className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Gerçekleşen / Planlanan
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {actualQuantity.toLocaleString("tr-TR")}
                <span className="ml-2 text-lg font-semibold text-slate-400">
                  / {plannedQuantity.toLocaleString("tr-TR")}
                </span>
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 px-4 py-3 text-right">
              <p className="text-xs font-medium text-indigo-500">
                Tamamlanma
              </p>

              <p className="mt-1 text-2xl font-bold text-indigo-700">
                %{progressPercentage.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${Math.min(progressPercentage, 100)}%`,
              }}
            />
          </div>

          {progressPercentage > 100 && (
            <p className="mt-3 text-sm font-medium text-amber-600">
              Planlanan miktar %{(progressPercentage - 100).toFixed(1)} oranında aşıldı.
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Planlanan"
          value={plannedQuantity.toLocaleString("tr-TR")}
          description="Üretim hedefi"
        />

        <MetricCard
          label="Gerçekleşen"
          value={actualQuantity.toLocaleString("tr-TR")}
          description="Toplam üretilen"
        />
        <MetricCard
            label="Aktif Rezervasyon"
            value={String(activeReservationCount)}
            description="Rezerve hammadde kalemi"
        />

        <MetricCard
          label="Toplam Fire"
          value={totalScrap.toLocaleString("tr-TR")}
          description="Hammadde firesi"
        />

        <MetricCard
          label="Fire Oranı"
          value={`%${scrapRate.toFixed(2)}`}
          description="Toplam tüketime göre"
        />
      </div>

      {lastProgress && (
        <Card title="Son İlerleme Kaydı">
          <div className="grid grid-cols-3 gap-5 p-5">
            <DetailItem
              label="Eklenen Miktar"
              value={`+${lastProgress.producedQuantity.toLocaleString("tr-TR")}`}
            />

            <DetailItem
              label="Kaydeden"
              value={lastProgress.employeeName ?? "-"}
            />

            <DetailItem
              label="Tarih"
              value={formatDateTime(lastProgress.progressDate)}
            />

            <div className="col-span-3">
              <p className="text-sm text-slate-400">Not</p>

              <p className="mt-1 font-medium text-slate-700">
                {lastProgress.note || "İşlem notu girilmemiş."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card title={`İlerleme Kayıtları (${sortedProgresses.length})`}>
        <div className="p-5">
          {sortedProgresses.length > 0 ? (
            <div className="relative space-y-0">
              {sortedProgresses.map((progress, index) => (
                <ProductionProgressTimelineItem
                  key={progress.id}
                  progress={progress}
                  isLast={index === sortedProgresses.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="font-semibold text-slate-600">
                Henüz ilerleme kaydı bulunmuyor.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Üretim başladıktan sonra “İlerleme Ekle” işlemiyle kayıt oluşturabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ProductionProgressTimelineItem({
  progress,
  isLast,
}: {
  progress: ProductionProgress;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />
      )}

      <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-4 border-indigo-100 bg-indigo-600" />

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-emerald-700">
              +{progress.producedQuantity.toLocaleString("tr-TR")}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {progress.employeeName ?? "Kullanıcı bilgisi yok"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">
              {formatDateTime(progress.progressDate)}
            </p>
          </div>
        </div>

        {progress.note && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {progress.note}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductionWorkflowTab({
  production,
}: {
  production: Production;
}) {
  const histories = [...(production.workflowHistories ?? [])].sort(
    (first, second) =>
      new Date(second.changeDate).getTime() -
      new Date(first.changeDate).getTime()
  );

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-sm text-slate-500">
          Mevcut Durum
        </p>

        <div className="mt-3">
          <StatusBadge
            text={
              production.productionStatusName ??
              "Tanımsız"
            }
            color={
              production.productionStatusBadgeColor ??
              "neutral"
            }
          />
        </div>
      </Card>

      <Card title="Kullanılabilir İşlemler">
        <div className="flex flex-wrap gap-3 p-5">
          {production.allowedTransitions?.map(
            (transition) => (
              <div
                key={transition.targetStatusCode}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="font-semibold text-slate-800">
                  {transition.actionName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Hedef: {transition.statusName}
                </p>
              </div>
            )
          )}

          {!production.allowedTransitions?.length && (
            <p className="text-sm text-slate-500">
              Kullanılabilir durum geçişi bulunmuyor.
            </p>
          )}
        </div>
      </Card>

      <Card title={`İş Akışı Geçmişi (${histories.length})`}>
        <div className="p-5">
          {histories.length > 0 ? (
            <div className="space-y-0">
              {histories.map((history, index) => (
                <WorkflowHistoryTimelineItem
                  key={history.id}
                  history={history}
                  isLast={index === histories.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="font-semibold text-slate-600">
                Henüz iş akışı geçmişi bulunmuyor.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Üretim durumu değiştirildiğinde kayıtlar burada görünecek.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function WorkflowHistoryTimelineItem({
  history,
  isLast,
}: {
  history: WorkflowHistory;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[7px] top-5 h-full w-px bg-slate-200" />
      )}

      <div className="relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-4 border-blue-100 bg-blue-600" />

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">
              {history.fromStatusName ?? "Başlangıç"}
              <span className="mx-2 text-slate-400">→</span>
              {history.toStatusName ?? "Tanımsız"}
            </p>

            <p className="mt-1 text-sm font-medium text-slate-600">
              {history.employeeName ?? "Kullanıcı bilgisi yok"}
            </p>
          </div>

          <p className="text-xs font-medium text-slate-500">
            {formatDateTime(history.changeDate)}
          </p>
        </div>

        {history.note && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {history.note}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Card>
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
  return new Date(value).toLocaleDateString(
    "tr-TR"
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(
    "tr-TR"
  );
}