import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";

import {
  parameterDefinitionService,
  type ParameterDefinition,
} from "../services/parameterService";

export default function ParameterDefinitionsPage() {
  const queryClient = useQueryClient();

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [paramType, setParamType] = useState("");
  const [description, setDescription] = useState("");
  const [dataType, setDataType] = useState("int");
  const [defaultValue, setDefaultValue] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [paramTypeFilter, setParamTypeFilter] = useState("");

  const definitionsQuery = useQuery({
    queryKey: ["parameterDefinitions"],
    queryFn: parameterDefinitionService.getList,
  });

  const createMutation = useMutation({
    mutationFn: parameterDefinitionService.create,
    onSuccess: async () => {
      setParamType("");
      setDescription("");
      setDataType("int");
      setDefaultValue("");
      setShowCreatePanel(false);
      await queryClient.invalidateQueries({ queryKey: ["parameterDefinitions"] });
    },
  });

  const definitions = definitionsQuery.data ?? [];

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

    return list;
  }, [definitions, globalSearchText, paramTypeFilter]);

  const createDefinition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!paramType.trim()) return;

    createMutation.mutate({
      paramType: paramType.trim(),
      description: description.trim() || null,
      dataType: dataType || null,
      defaultValue: defaultValue.trim() || null,
      parameterValues: [],
    });
  };

  const columns: DataTableColumn<ParameterDefinition>[] = [
    {
      header: "Parametre Tipi",
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.paramType}</p>
          <p className="text-xs text-slate-400">ID: {item.id}</p>
        </div>
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
      render: () => (
        <div className="flex items-center gap-2">
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
        title="Parametre Tanımları"
        moduleName="Sistem"
        description="Müşteri tipi, ödeme tipi, durum gibi parametrik alanları tanımlayın."
        rightContent={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGlobalSearchText("");
                setParamTypeFilter("");
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
              Yeni Tanım
            </button>
          </div>
        }
      />

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-3 gap-4">
          <SelectInput
            label="Data Type"
            value=""
            onChange={() => {}}
            placeholder="Tümü"
            options={[
              { label: "int", value: "int" },
              { label: "string", value: "string" },
              { label: "bool", value: "bool" },
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
            onClick={() => definitionsQuery.refetch()}
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
          loading={definitionsQuery.isLoading}
          emptyText="Parametre tanımı bulunamadı."
          totalCount={filteredDefinitions.length}
        />
      </Card>

      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[520px] h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Yeni Parametre Tanımı
                </h3>
                <p className="text-sm text-slate-500">
                  Parametre tipini oluşturun.
                </p>
              </div>

              <button
                onClick={() => setShowCreatePanel(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createDefinition} className="space-y-4">
              <TextInput
                label="Parametre Tipi"
                value={paramType}
                onChange={setParamType}
                placeholder="Örn: CustomerType"
                required
              />

              <TextInput
                label="Açıklama"
                value={description}
                onChange={setDescription}
                placeholder="Örn: Müşteri tipi"
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
                label="Varsayılan Değer"
                value={defaultValue}
                onChange={setDefaultValue}
              />

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
    </div>
  );
}