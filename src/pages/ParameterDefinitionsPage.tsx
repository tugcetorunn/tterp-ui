import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";

import {
  parameterDefinitionService,
  parameterValueService,
  type ParameterDefinition,
  type ParameterValue,
} from "../services/parameterService";

interface ValueRow {
  paramCode: string;
  paramValue: string;
  description: string;
  languageId: string;
}

export default function ParameterDefinitionsPage() {
  const queryClient = useQueryClient();

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [selectedDefinition, setSelectedDefinition] =
    useState<ParameterDefinition | null>(null);

  const [paramType, setParamType] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState("int");
  const [defaultValue, setDefaultValue] = useState("");

  const [valueRows, setValueRows] = useState<ValueRow[]>([
    { paramCode: "1", paramValue: "", description: "", languageId: "1" },
  ]);

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [paramTypeFilter, setParamTypeFilter] = useState("");
  const [dataTypeFilter, setDataTypeFilter] = useState("");

  const definitionsQuery = useQuery({
    queryKey: ["parameterDefinitions"],
    queryFn: parameterDefinitionService.getList,
  });

  const valuesQuery = useQuery({
    queryKey: ["parameterValues"],
    queryFn: parameterValueService.getList,
  });

  const createMutation = useMutation({
    mutationFn: parameterDefinitionService.create,
    onSuccess: async () => {
      resetForm();
      setShowCreatePanel(false);
      await queryClient.invalidateQueries({ queryKey: ["parameterDefinitions"] });
      await queryClient.invalidateQueries({ queryKey: ["parameterValues"] });
    },
  });

  const definitions = definitionsQuery.data ?? [];
  const values = valuesQuery.data ?? [];

  const resetForm = () => {
    setParamType("");
    setDescription("");
    setDataType("int");
    setDefaultValue("");
    setValueRows([
      { paramCode: "1", paramValue: "", description: "", languageId: "1" },
    ]);
  };

  const addValueRow = () => {
    setValueRows((prev) => [
      ...prev,
      {
        paramCode: String(prev.length + 1),
        paramValue: "",
        description: "",
        languageId: "1",
      },
    ]);
  };

  const removeValueRow = (index: number) => {
    setValueRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateValueRow = (
    index: number,
    field: keyof ValueRow,
    value: string
  ) => {
    setValueRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const filteredDefinitions = useMemo(() => {
    let list = [...definitions];

    if (globalSearchText.trim()) {
      const search = globalSearchText.toLowerCase();

      list = list.filter(
        (x) =>
          x.paramType?.toLowerCase().includes(search) ||
          x.description?.toLowerCase().includes(search)
      );
    }

    if (paramTypeFilter.trim()) {
      const search = paramTypeFilter.toLowerCase();
      list = list.filter((x) => x.paramType?.toLowerCase().includes(search));
    }

    if (dataTypeFilter) {
      list = list.filter((x) => x.dataType === dataTypeFilter);
    }

    return list;
  }, [definitions, globalSearchText, paramTypeFilter, dataTypeFilter]);

  const getValueCount = (definition: ParameterDefinition) => {
    return values.filter(
      (x) => x.parameterDefinitionId === definition.id
    ).length;
  };

const getSelectedValues = (): ParameterValue[] => {
    if (!selectedDefinition) return [];

    return values.filter(
      (x) => x.parameterDefinitionId === selectedDefinition.id
    );
  };

  const createDefinition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!paramType.trim()) return;

    const validValues = valueRows
      .filter((x) => x.paramCode.trim() && x.paramValue.trim())
      .map((x) => ({
        paramType: paramType.trim(),
        paramCode: x.paramCode.trim(),
        paramValue: x.paramValue.trim(),
        description: x.description.trim() || null,
        languageId: Number(x.languageId || 1),
      }));

    createMutation.mutate({
      paramType: paramType.trim(),
      description: description.trim() || null,
      dataType: dataType || null,
      defaultValue: defaultValue.trim() || null,
      parameterValues: validValues,
    });
  };

  const columns: DataTableColumn<ParameterDefinition>[] = [
    {
      header: "Parametre Tipi",
      render: (item) => (
        <button
          onClick={() => setSelectedDefinition(item)}
          className="text-left"
        >
          <p className="font-semibold text-slate-800 hover:text-indigo-600">
            {item.paramType}
          </p>
          <p className="text-xs text-slate-400">ID: {item.id}</p>
        </button>
      ),
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Tip ara..."
          value={paramTypeFilter}
          onChange={(e) => setParamTypeFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Açıklama",
      render: (item) => item.description || "-",
      filter: null,
    },
    {
      header: "Data Type",
      render: (item) => item.dataType || "-",
      filter: null,
    },
    {
      header: "Varsayılan",
      render: (item) => item.defaultValue || "-",
      filter: null,
    },
    {
      header: "Değer Sayısı",
      render: (item) => (
        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
          {getValueCount(item)} değer
        </span>
      ),
      filter: null,
    },
    {
      header: "Durum",
      render: (item) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive === false
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {item.isActive === false ? "Pasif" : "Aktif"}
        </span>
      ),
      filter: null,
    },
    {
      header: "İşlemler",
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDefinition(item)}
            className="w-9 h-9 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100"
          >
            <Eye size={16} />
          </button>

          <button className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100">
            <Edit size={16} />
          </button>

          <button className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100">
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
        title="Parametreler"
        moduleName="Sistem"
        description="Müşteri tipi, ödeme tipi, durum ve benzeri sabit değerleri yönetin."
        rightContent={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGlobalSearchText("");
                setParamTypeFilter("");
                setDataTypeFilter("");
              }}
              className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50"
            >
              <X size={18} />
              Filtreleri Temizle
            </button>

            <button
              onClick={() => setShowCreatePanel(true)}
              className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2 hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Parametre
            </button>
          </div>
        }
      />

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-3 gap-4">
          <SelectInput
          label="Data Type"
          value={dataTypeFilter}
          onChange={setDataTypeFilter}
          placeholder="Tümü"
          options={[
            { label: "int", value: "int" },
            { label: "string", value: "string" },
            { label: "bool", value: "bool" },
            { label: "datetime", value: "datetime" },
          ]}
        />

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Arama
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3 text-slate-400" size={18} />
              <input
                className="w-full h-11 border border-slate-200 rounded-xl pl-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Parametre tipi veya açıklama ara..."
                value={globalSearchText}
                onChange={(e) => setGlobalSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredDefinitions.length} parametre tanımı bulundu`}
        headerRight={
          <button
            onClick={() => {
              definitionsQuery.refetch();
              valuesQuery.refetch();
            }}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Yenile
          </button>
        }
      >
        <DataTable
          columns={columns}
          data={filteredDefinitions}
          loading={definitionsQuery.isLoading || valuesQuery.isLoading}
          emptyText="Parametre tanımı bulunamadı."
          totalCount={filteredDefinitions.length}
        />
      </Card>

      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[760px] h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Yeni Parametre
                </h3>
                <p className="text-sm text-slate-500">
                  Tanım ve değerleri birlikte oluşturun.
                </p>
              </div>

              <button
                onClick={() => setShowCreatePanel(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createDefinition} className="space-y-5">
              <Card title="Tanım Bilgileri" className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <TextInput
                    label="Parametre Tipi"
                    value={paramType}
                    onChange={setParamType}
                    placeholder="Örn: CustomerType"
                    required
                  />

                  <SelectInput
                    label="Data Type"
                    value={dataType}
                    onChange={setDataType}
                    options={[
                      { label: "int", value: "int" },
                      { label: "string", value: "string" },
                      { label: "bool", value: "bool" },
                      { label: "datetime", value: "datetime" },
                    ]}
                  />

                  <TextInput
                    label="Açıklama"
                    value={description}
                    onChange={setDescription}
                    placeholder="Örn: Müşteri tipi"
                  />

                  <TextInput
                    label="Varsayılan Değer"
                    value={defaultValue}
                    onChange={setDefaultValue}
                  />
                </div>
              </Card>

              <Card
                title="Parametre Değerleri"
                headerRight={
                  <button
                    type="button"
                    onClick={addValueRow}
                    className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-indigo-700"
                  >
                    <Plus size={16} />
                    Satır Ekle
                  </button>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-4 py-3">Kod</th>
                        <th className="text-left px-4 py-3">Değer</th>
                        <th className="text-left px-4 py-3">Açıklama</th>
                        <th className="text-left px-4 py-3">Dil</th>
                        <th className="text-left px-4 py-3">Sil</th>
                      </tr>
                    </thead>

                    <tbody>
                      {valueRows.map((row, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="px-4 py-3">
                            <input
                              className="w-20 h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={row.paramCode}
                              onChange={(e) =>
                                updateValueRow(index, "paramCode", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Örn: Bireysel"
                              value={row.paramValue}
                              onChange={(e) =>
                                updateValueRow(index, "paramValue", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-4 py-3">
                            <input
                              className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={row.description}
                              onChange={(e) =>
                                updateValueRow(index, "description", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-4 py-3">
                            <select
                              className="w-28 h-10 border border-slate-200 rounded-lg px-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                              value={row.languageId}
                              onChange={(e) =>
                                updateValueRow(index, "languageId", e.target.value)
                              }
                            >
                              <option value="1">Türkçe</option>
                              <option value="2">English</option>
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removeValueRow(index)}
                              className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
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
                disabled={createMutation.isPending}
                className="w-full h-12 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
              >
                {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedDefinition && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[620px] h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDefinition.paramType}
                </h3>
                <p className="text-sm text-slate-500">
                  Parametre değerleri görüntüleniyor.
                </p>
              </div>

              <button
                onClick={() => setSelectedDefinition(null)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <Card title="Tanım Bilgileri" className="mb-5">
              <div className="p-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Parametre Tipi</p>
                  <p className="font-semibold text-slate-800">
                    {selectedDefinition.paramType}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Data Type</p>
                  <p className="font-semibold text-slate-800">
                    {selectedDefinition.dataType || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Açıklama</p>
                  <p className="font-semibold text-slate-800">
                    {selectedDefinition.description || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400">Varsayılan</p>
                  <p className="font-semibold text-slate-800">
                    {selectedDefinition.defaultValue || "-"}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Parametre Değerleri">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3">Kod</th>
                    <th className="text-left px-4 py-3">Değer</th>
                    <th className="text-left px-4 py-3">Açıklama</th>
                    <th className="text-left px-4 py-3">Dil</th>
                  </tr>
                </thead>

                <tbody>
                  {getSelectedValues().map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{item.paramCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.paramValue}
                      </td>
                      <td className="px-4 py-3">{item.description || "-"}</td>
                      <td className="px-4 py-3">
                        {item.languageId === 1 ? "Türkçe" : item.languageId}
                      </td>
                    </tr>
                  ))}

                  {getSelectedValues().length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Bu parametreye ait değer bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}