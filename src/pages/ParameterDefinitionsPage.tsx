import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
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

import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";

import StatusBadge from "../components/common/StatusBadge";
import ActiveStatusBadge from "../components/common/ActiveStatusBadge";

import {
  parameterDefinitionService,
  parameterValueService,
} from "../services/parameterService";

import type {
  CreateParameterValueRequest,
  ParameterDefinition,
  ParameterValue,
} from "../services/parameterService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

interface ValueRow {
  paramCode: string;
  paramValue: string;
  description: string;
  languageId: string;

  shortCode: string;
  symbol: string;
  badgeColor: string;
  icon: string;
  displayOrder: string;
  isDefault: boolean;
}

const fallbackBadgeColorOptions = [
  { label: "Başarılı", value: "success" },
  { label: "Uyarı", value: "warning" },
  { label: "Hata", value: "danger" },
  { label: "Bilgi", value: "info" },
  { label: "Birincil", value: "primary" },
  { label: "İkincil", value: "secondary" },
  { label: "Nötr", value: "neutral" },
];

function createEmptyValueRow(paramCode = "1"): ValueRow {
  return {
    paramCode,
    paramValue: "",
    description: "",
    languageId: "1",

    shortCode: "",
    symbol: "",
    badgeColor: "",
    icon: "",
    displayOrder: paramCode,
    isDefault: false,
  };
}

export default function ParameterDefinitionsPage() {
  const queryClient = useQueryClient();

  const badgeColorParameters = useParameterOptions(
    "BadgeColorOptions"
  );

  // Drawer state
  const [showParameterDrawer, setShowParameterDrawer] =
    useState(false);

  const [
    valueTargetDefinition,
    setValueTargetDefinition,
  ] = useState<ParameterDefinition | null>(null);

  const [
    selectedDefinition,
    setSelectedDefinition,
  ] = useState<ParameterDefinition | null>(null);

  // Definition form
  const [paramType, setParamType] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState("int");
  const [defaultValue, setDefaultValue] = useState("");

  // Value form
  const [valueRows, setValueRows] = useState<ValueRow[]>([
    createEmptyValueRow(),
  ]);

  // Filters
  const [globalSearchText, setGlobalSearchText] =
    useState("");

  const [paramTypeFilter, setParamTypeFilter] =
    useState("");

  const [dataTypeFilter, setDataTypeFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] = useState("paramType");
  const [sortDirection, setSortDirection] =
    useState("asc");

  const definitionsQuery = useQuery({
    queryKey: ["parameterDefinitions"],
    queryFn: parameterDefinitionService.getList,
  });

  const valuesQuery = useQuery({
    queryKey: ["parameterValues"],
    queryFn: parameterValueService.getList,
  });

  const definitions = definitionsQuery.data ?? [];
  const values = valuesQuery.data ?? [];

  const badgeColorOptions = useMemo(() => {
    const parameterOptions = (
      badgeColorParameters.data ?? []
    ).map((item) => ({
      label: item.paramValue,
      value:
        item.shortCode?.trim() ||
        item.paramValue
          .trim()
          .toLocaleLowerCase("tr-TR"),
    }));

    return parameterOptions.length > 0
      ? parameterOptions
      : fallbackBadgeColorOptions;
  }, [badgeColorParameters.data]);

  const createDefinitionMutation = useMutation({
    mutationFn: parameterDefinitionService.create,

    onSuccess: async () => {
      closeParameterDrawer();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["parameterDefinitions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["parameterValues"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["parameter-options"],
        }),
      ]);
    },
  });

  const addValuesMutation = useMutation({
    mutationFn: parameterValueService.createMany,

    onSuccess: async () => {
      closeParameterDrawer();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["parameterDefinitions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["parameterValues"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["parameter-options"],
        }),
      ]);
    },
  });

  const resetParameterForm = () => {
    setParamType("");
    setDescription("");
    setDataType("int");
    setDefaultValue("");
    setValueRows([createEmptyValueRow()]);
  };

  const closeParameterDrawer = () => {
    setShowParameterDrawer(false);
    setValueTargetDefinition(null);

    createDefinitionMutation.reset();
    addValuesMutation.reset();

    resetParameterForm();
  };

  const openCreateParameterDrawer = () => {
    setValueTargetDefinition(null);
    resetParameterForm();
    setShowParameterDrawer(true);
  };

  const openAddValuesDrawer = (
    definition: ParameterDefinition
  ) => {
    const existingValues = values.filter(
      (value) =>
        value.parameterDefinitionId === definition.id
    );

    const greatestParamCode = existingValues.reduce(
      (maximum, value) => {
        const currentCode = Number(value.paramCode);

        if (!Number.isFinite(currentCode)) {
          return maximum;
        }

        return Math.max(maximum, currentCode);
      },
      0
    );

    setValueTargetDefinition(definition);

    setParamType(definition.paramType);
    setDescription(definition.description ?? "");
    setDataType(definition.dataType ?? "int");
    setDefaultValue(definition.defaultValue ?? "");

    setValueRows([
      createEmptyValueRow(
        String(greatestParamCode + 1)
      ),
    ]);

    setShowParameterDrawer(true);
  };

  const getDefinitionValues = (
    definitionId: number
  ): ParameterValue[] => {
    return values
      .filter(
        (value) =>
          value.parameterDefinitionId === definitionId
      )
      .sort((first, second) => {
        const orderDifference =
          (first.displayOrder ?? 0) -
          (second.displayOrder ?? 0);

        if (orderDifference !== 0) {
          return orderDifference;
        }

        return (
          Number(first.paramCode) -
          Number(second.paramCode)
        );
      });
  };

  const targetExistingValues = useMemo(() => {
    if (!valueTargetDefinition) {
      return [];
    }

    return getDefinitionValues(
      valueTargetDefinition.id
    );
  }, [valueTargetDefinition, values]);

  const selectedDefinitionValues = useMemo(() => {
    if (!selectedDefinition) {
      return [];
    }

    return getDefinitionValues(selectedDefinition.id);
  }, [selectedDefinition, values]);

  const addValueRow = () => {
    setValueRows((previousRows) => {
      const allCodes = [
        ...targetExistingValues.map((value) =>
          Number(value.paramCode)
        ),
        ...previousRows.map((row) =>
          Number(row.paramCode)
        ),
      ].filter(Number.isFinite);

      const greatestCode =
        allCodes.length > 0
          ? Math.max(...allCodes)
          : 0;

      return [
        ...previousRows,
        createEmptyValueRow(
          String(greatestCode + 1)
        ),
      ];
    });
  };

  const removeValueRow = (index: number) => {
    setValueRows((previousRows) => {
      if (previousRows.length === 1) {
        return [createEmptyValueRow()];
      }

      return previousRows.filter(
        (_, rowIndex) => rowIndex !== index
      );
    });
  };

  const updateValueRow = <
    K extends keyof ValueRow,
  >(
    index: number,
    field: K,
    value: ValueRow[K]
  ) => {
    setValueRows((previousRows) =>
      previousRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const updateDefaultValueRow = (
    selectedIndex: number,
    checked: boolean
  ) => {
    setValueRows((previousRows) =>
      previousRows.map((row, rowIndex) => ({
        ...row,
        isDefault:
          rowIndex === selectedIndex
            ? checked
            : checked
              ? false
              : row.isDefault,
      }))
    );
  };

  const createValueRequests =
    (): CreateParameterValueRequest[] => {
      return valueRows
        .filter(
          (row) =>
            row.paramCode.trim() &&
            row.paramValue.trim()
        )
        .map((row) => ({
          ...(valueTargetDefinition
          ? {
              parameterDefinitionId:
                valueTargetDefinition.id,
            }
          : {}),
          paramType: paramType.trim(),
          paramCode: row.paramCode.trim(),
          paramValue: row.paramValue.trim(),

          description:
            row.description.trim() || null,

          languageId: Number(
            row.languageId || 1
          ),

          shortCode:
            row.shortCode.trim() || null,

          symbol: row.symbol.trim() || null,

          badgeColor:
            row.badgeColor.trim() || null,

          icon: row.icon.trim() || null,

          displayOrder: Number(
            row.displayOrder ||
              row.paramCode ||
              0
          ),

          isDefault: row.isDefault,
        }));
    };

  const submitParameterForm = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!paramType.trim()) {
      return;
    }

    const valueRequests = createValueRequests();

    if (valueRequests.length === 0) {
      return;
    }

    if (valueTargetDefinition) {
      addValuesMutation.mutate(valueRequests);
      return;
    }

    createDefinitionMutation.mutate({
      paramType: paramType.trim(),

      description:
        description.trim() || null,

      dataType: dataType || null,

      defaultValue:
        defaultValue.trim() || null,

      parameterValues: valueRequests,
    });
  };

  const clearFilters = () => {
    setGlobalSearchText("");
    setParamTypeFilter("");
    setDataTypeFilter("");
    setStatusFilter("");
    setSortBy("paramType");
    setSortDirection("asc");
  };

  const filteredDefinitions = useMemo(() => {
    let list = [...definitions];

    if (globalSearchText.trim()) {
      const search = globalSearchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter(
        (definition) =>
          definition.paramType
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          definition.description
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          definition.dataType
            ?.toLocaleLowerCase("tr-TR")
            .includes(search)
      );
    }

    if (paramTypeFilter.trim()) {
      const search = paramTypeFilter
        .trim()
        .toLocaleLowerCase("tr-TR");

      list = list.filter((definition) =>
        definition.paramType
          ?.toLocaleLowerCase("tr-TR")
          .includes(search)
      );
    }

    if (dataTypeFilter) {
      list = list.filter(
        (definition) =>
          definition.dataType === dataTypeFilter
      );
    }

    if (statusFilter) {
      list = list.filter((definition) =>
        statusFilter === "active"
          ? definition.isActive
          : !definition.isActive
      );
    }

    list.sort((first, second) => {
      let result = 0;

      if (sortBy === "paramType") {
        result = first.paramType.localeCompare(
          second.paramType,
          "tr"
        );
      }

      if (sortBy === "dataType") {
        result = (
          first.dataType ?? ""
        ).localeCompare(
          second.dataType ?? "",
          "tr"
        );
      }

      if (sortBy === "valueCount") {
        result =
          getDefinitionValues(first.id).length -
          getDefinitionValues(second.id).length;
      }

      return sortDirection === "asc"
        ? result
        : -result;
    });

    return list;
  }, [
    definitions,
    values,
    globalSearchText,
    paramTypeFilter,
    dataTypeFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const columns: DataTableColumn<ParameterDefinition>[] =
    [
      {
        header: "Parametre Tipi",

        render: (definition) => (
          <button
            type="button"
            onClick={() =>
              setSelectedDefinition(definition)
            }
            className="text-left"
          >
            <p className="font-semibold text-slate-800 hover:text-indigo-600">
              {definition.paramType}
            </p>

            <p className="text-xs text-slate-400">
              ID: {definition.id}
            </p>
          </button>
        ),

        filter: (
          <input
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Parametre tipi ara..."
            value={paramTypeFilter}
            onChange={(event) =>
              setParamTypeFilter(
                event.target.value
              )
            }
          />
        ),
      },
      {
        header: "Açıklama",

        render: (definition) =>
          definition.description || "-",

        filter: null,
      },
      {
        header: "Data Type",

        render: (definition) => (
          <StatusBadge
            text={definition.dataType || "-"}
            color="info"
          />
        ),

        filter: (
          <select
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            value={dataTypeFilter}
            onChange={(event) =>
              setDataTypeFilter(
                event.target.value
              )
            }
          >
            <option value="">Tümü</option>
            <option value="int">int</option>
            <option value="string">string</option>
            <option value="bool">bool</option>
            <option value="datetime">
              datetime
            </option>
            <option value="decimal">
              decimal
            </option>
          </select>
        ),
      },
      {
        header: "Varsayılan",

        render: (definition) =>
          definition.defaultValue || "-",

        filter: null,
      },
      {
        header: "Değer Sayısı",

        render: (definition) => {
          const valueCount =
            getDefinitionValues(
              definition.id
            ).length;

          return (
            <button
              type="button"
              onClick={() =>
                setSelectedDefinition(definition)
              }
              className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
            >
              {valueCount} değer
            </button>
          );
        },

        filter: null,
      },
      {
        header: "Durum",

        render: (definition) => (
          <ActiveStatusBadge
            isActive={definition.isActive}
          />
        ),

        filter: (
          <select
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">Tümü</option>
            <option value="active">
              Aktif
            </option>
            <option value="passive">
              Pasif
            </option>
          </select>
        ),
      },
      {
        header: "İşlemler",

        render: (definition) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Yeni değer ekle"
              onClick={() =>
                openAddValuesDrawer(definition)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            >
              <Plus size={16} />
            </button>

            <button
              type="button"
              title="Görüntüle"
              onClick={() =>
                setSelectedDefinition(definition)
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

  const isSaving =
    createDefinitionMutation.isPending ||
    addValuesMutation.isPending;

  const mutationError =
    createDefinitionMutation.error ??
    addValuesMutation.error;

  return (
    <div>
      <PageHeader
        title="Parametreler"
        moduleName="Sistem"
        description="Müşteri tipi, para birimi, durum, birim ve diğer parametrik değerleri yönetin."
        rightContent={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <X size={18} />
              Filtreleri Temizle
            </button>

            <button
              type="button"
              onClick={
                openCreateParameterDrawer
              }
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Parametre
            </button>
          </div>
        }
      />

      {(definitionsQuery.isError ||
        valuesQuery.isError) && (
        <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {definitionsQuery.isError
            ? getErrorMessage(
                definitionsQuery.error
              )
            : getErrorMessage(
                valuesQuery.error
              )}
        </div>
      )}

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-5 gap-4">
          <SelectInput
            label="Data Type"
            value={dataTypeFilter}
            onChange={setDataTypeFilter}
            placeholder="Tümü"
            options={[
              {
                label: "int",
                value: "int",
              },
              {
                label: "string",
                value: "string",
              },
              {
                label: "bool",
                value: "bool",
              },
              {
                label: "datetime",
                value: "datetime",
              },
              {
                label: "decimal",
                value: "decimal",
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
                label: "Parametre Tipi",
                value: "paramType",
              },
              {
                label: "Data Type",
                value: "dataType",
              },
              {
                label: "Değer Sayısı",
                value: "valueCount",
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
                placeholder="Tip, açıklama, data type..."
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
      </Card>

      <Card
        title={`Toplam ${filteredDefinitions.length} parametre tanımı bulundu`}
        headerRight={
          <button
            type="button"
            onClick={() => {
              definitionsQuery.refetch();
              valuesQuery.refetch();
            }}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Yenile
          </button>
        }
      >
        <DataTable
          columns={columns}
          data={filteredDefinitions}
          loading={
            definitionsQuery.isLoading ||
            valuesQuery.isLoading
          }
          emptyText="Parametre tanımı bulunamadı."
          totalCount={
            filteredDefinitions.length
          }
        />
      </Card>

      <CreateDrawer
        open={showParameterDrawer}
        title={
          valueTargetDefinition
            ? "Parametre Değeri Ekle"
            : "Yeni Parametre"
        }
        subtitle={
          valueTargetDefinition
            ? `${valueTargetDefinition.paramType} tanımına yeni değerler ekleyin.`
            : "Parametre tanımını ve başlangıç değerlerini birlikte oluşturun."
        }
        onClose={closeParameterDrawer}
        widthClassName="w-[1100px]"
      >
        {mutationError && (
          <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {getErrorMessage(
              mutationError
            )}
          </div>
        )}

        <form
          onSubmit={submitParameterForm}
          className="space-y-5"
        >
          <Card title="Tanım Bilgileri">
            <div className="grid grid-cols-2 gap-4 p-5">
              <TextInput
                label="Parametre Tipi"
                value={paramType}
                onChange={setParamType}
                placeholder="Örn: ProductionStatus"
                disabled={Boolean(
                  valueTargetDefinition
                )}
                required
              />

              <SelectInput
                label="Data Type"
                value={dataType}
                onChange={setDataType}
                disabled={Boolean(
                  valueTargetDefinition
                )}
                options={[
                  {
                    label: "int",
                    value: "int",
                  },
                  {
                    label: "string",
                    value: "string",
                  },
                  {
                    label: "bool",
                    value: "bool",
                  },
                  {
                    label: "datetime",
                    value: "datetime",
                  },
                  {
                    label: "decimal",
                    value: "decimal",
                  },
                ]}
              />

              <TextInput
                label="Açıklama"
                value={description}
                onChange={setDescription}
                placeholder="Parametre açıklaması"
                disabled={Boolean(
                  valueTargetDefinition
                )}
              />

              <TextInput
                label="Varsayılan Değer"
                value={defaultValue}
                onChange={setDefaultValue}
                placeholder="Opsiyonel"
                disabled={Boolean(
                  valueTargetDefinition
                )}
              />
            </div>
          </Card>

          {valueTargetDefinition && (
            <Card title="Mevcut Parametre Değerleri">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        Kod
                      </th>

                      <th className="px-4 py-3 text-left">
                        Değer
                      </th>

                      <th className="px-4 py-3 text-left">
                        Kısa Kod
                      </th>

                      <th className="px-4 py-3 text-left">
                        Sembol
                      </th>

                      <th className="px-4 py-3 text-left">
                        Renk
                      </th>

                      <th className="px-4 py-3 text-left">
                        İkon
                      </th>

                      <th className="px-4 py-3 text-left">
                        Sıra
                      </th>

                      <th className="px-4 py-3 text-left">
                        Varsayılan
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {targetExistingValues.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-3">
                            {item.paramCode}
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {item.paramValue}
                          </td>

                          <td className="px-4 py-3">
                            {item.shortCode ||
                              "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.symbol || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.badgeColor ? (
                              <StatusBadge
                                text={
                                  item.badgeColor
                                }
                                color={
                                  item.badgeColor
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {item.icon || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.displayOrder ??
                              0}
                          </td>

                          <td className="px-4 py-3">
                            {item.isDefault
                              ? "Evet"
                              : "Hayır"}
                          </td>
                        </tr>
                      )
                    )}

                    {targetExistingValues.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Mevcut parametre
                          değeri bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card
            title={
              valueTargetDefinition
                ? "Eklenecek Yeni Değerler"
                : "Parametre Değerleri"
            }
            headerRight={
              <button
                type="button"
                onClick={addValueRow}
                className="flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={16} />
                Satır Ekle
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-[1400px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      Kod
                    </th>

                    <th className="px-3 py-3 text-left">
                      Değer
                    </th>

                    <th className="px-3 py-3 text-left">
                      Açıklama
                    </th>

                    <th className="px-3 py-3 text-left">
                      Dil
                    </th>

                    <th className="px-3 py-3 text-left">
                      Kısa Kod
                    </th>

                    <th className="px-3 py-3 text-left">
                      Sembol
                    </th>

                    <th className="px-3 py-3 text-left">
                      Rozet Rengi
                    </th>

                    <th className="px-3 py-3 text-left">
                      İkon
                    </th>

                    <th className="px-3 py-3 text-left">
                      Sıra
                    </th>

                    <th className="px-3 py-3 text-center">
                      Varsayılan
                    </th>

                    <th className="px-3 py-3 text-center">
                      Sil
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {valueRows.map(
                    (row, index) => (
                      <tr
                        key={index}
                        className="border-t border-slate-100 align-top"
                      >
                        <td className="min-w-[90px] px-3 py-3">
                          <input
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={
                              row.paramCode
                            }
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "paramCode",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="min-w-[190px] px-3 py-3">
                          <input
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Örn: Planlandı"
                            value={
                              row.paramValue
                            }
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "paramValue",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="min-w-[220px] px-3 py-3">
                          <input
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Opsiyonel"
                            value={
                              row.description
                            }
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "description",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="min-w-[130px] px-3 py-3">
                          <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={
                              row.languageId
                            }
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "languageId",
                                event.target.value
                              )
                            }
                          >
                            <option value="1">
                              Türkçe
                            </option>

                            <option value="2">
                              English
                            </option>
                          </select>
                        </td>

                        <td className="min-w-[130px] px-3 py-3">
                          <input
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="TRY"
                            value={
                              row.shortCode
                            }
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "shortCode",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="min-w-[100px] px-3 py-3">
                          <input
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="₺"
                            value={row.symbol}
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "symbol",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="min-w-[170px] px-3 py-3">
                          <SelectInput
                            value={
                              row.badgeColor
                            }
                            onChange={(value) =>
                              updateValueRow(
                                index,
                                "badgeColor",
                                value
                              )
                            }
                            placeholder="Renk seçin"
                            options={
                              badgeColorOptions
                            }
                          />
                        </td>

                        <td className="min-w-[150px] px-3 py-3">
                          <input
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Örn: truck"
                            value={row.icon}
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "icon",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="min-w-[90px] px-3 py-3">
                          <input
                            type="number"
                            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={
                              row.displayOrder
                            }
                            onChange={(event) =>
                              updateValueRow(
                                index,
                                "displayOrder",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td className="px-3 py-5 text-center">
                          <input
                            type="checkbox"
                            checked={
                              row.isDefault
                            }
                            onChange={(event) =>
                              updateDefaultValueRow(
                                index,
                                event.target.checked
                              )
                            }
                            className="h-4 w-4 accent-indigo-600"
                          />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeValueRow(
                                index
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
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <button
            type="submit"
            disabled={isSaving}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Kaydediliyor..."
              : valueTargetDefinition
                ? "Yeni Değerleri Kaydet"
                : "Parametreyi Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedDefinition)}
        title={
          selectedDefinition?.paramType ??
          "Parametre"
        }
        subtitle="Parametre tanımı ve bağlı değerleri"
        onClose={() =>
          setSelectedDefinition(null)
        }
        widthClassName="w-[900px]"
        headerRight={
          selectedDefinition ? (
            <button
              type="button"
              onClick={() => {
                const definition =
                  selectedDefinition;

                setSelectedDefinition(null);
                openAddValuesDrawer(
                  definition
                );
              }}
              className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={16} />
              Değer Ekle
            </button>
          ) : null
        }
      >
        {selectedDefinition && (
          <div className="space-y-5">
            <Card title="Tanım Bilgileri">
              <div className="grid grid-cols-2 gap-5 p-5 text-sm">
                <DetailItem
                  label="Parametre Tipi"
                  value={
                    selectedDefinition.paramType
                  }
                />

                <DetailItem
                  label="Data Type"
                  value={
                    selectedDefinition.dataType ||
                    "-"
                  }
                />

                <DetailItem
                  label="Açıklama"
                  value={
                    selectedDefinition.description ||
                    "-"
                  }
                />

                <DetailItem
                  label="Varsayılan Değer"
                  value={
                    selectedDefinition.defaultValue ||
                    "-"
                  }
                />

                <div>
                  <p className="text-slate-400">
                    Durum
                  </p>

                  <div className="mt-1">
                    <ActiveStatusBadge
                      isActive={
                        selectedDefinition.isActive
                      }
                    />
                  </div>
                </div>

                <DetailItem
                  label="Değer Sayısı"
                  value={
                    selectedDefinitionValues.length
                  }
                />
              </div>
            </Card>

            <Card title="Parametre Değerleri">
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        Kod
                      </th>

                      <th className="px-4 py-3 text-left">
                        Değer
                      </th>

                      <th className="px-4 py-3 text-left">
                        Kısa Kod
                      </th>

                      <th className="px-4 py-3 text-left">
                        Sembol
                      </th>

                      <th className="px-4 py-3 text-left">
                        Rozet
                      </th>

                      <th className="px-4 py-3 text-left">
                        İkon
                      </th>

                      <th className="px-4 py-3 text-left">
                        Sıra
                      </th>

                      <th className="px-4 py-3 text-left">
                        Dil
                      </th>

                      <th className="px-4 py-3 text-left">
                        Varsayılan
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedDefinitionValues.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-3">
                            {item.paramCode}
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {item.paramValue}
                          </td>

                          <td className="px-4 py-3">
                            {item.shortCode ||
                              "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.symbol || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.badgeColor ? (
                              <StatusBadge
                                text={
                                  item.badgeColor
                                }
                                color={
                                  item.badgeColor
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {item.icon || "-"}
                          </td>

                          <td className="px-4 py-3">
                            {item.displayOrder ??
                              0}
                          </td>

                          <td className="px-4 py-3">
                            {item.languageId ===
                            1
                              ? "Türkçe"
                              : item.languageId ===
                                  2
                                ? "English"
                                : item.languageId}
                          </td>

                          <td className="px-4 py-3">
                            {item.isDefault ? (
                              <StatusBadge
                                text="Varsayılan"
                                color="success"
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
                    )}

                    {selectedDefinitionValues.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Bu tanıma ait
                          parametre değeri
                          bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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