import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import MultiSelect from "../components/form/MultiSelect";
import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";
import {
  getErrorMessage,
} from "../utils/apiResponse";

import { categoryService } from "../services/categoryService";
import type { Category } from "../services/categoryService";

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [categoryNameFilter, setCategoryNameFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdDate");
  const [sortDirection, setSortDirection] = useState("desc");

  const [formError, setFormError] =
  useState<string | null>(null);
  
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getList,
  });

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onMutate: () => {
    setFormError(null);
  },
    onSuccess: async () => {
      setName("");
      setDescription("");
      setFormError(null);
      setShowCreatePanel(false);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // const createCategory = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   setFormError(null);

  // // if (!name.trim()) {
  // //   setFormError(
  // //     "Kategori adı zorunludur."
  // //   );
  // //   return;
  // // }

  //   createMutation.mutate({
  //     name: name.trim(),
  //     description: description.trim() || null,
  //   });
  // };

  const createCategory = (
  event:
    React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!name.trim()) {
    toast.warning(
      "Kategori adı zorunludur."
    );
    return;
  }

  createMutation.mutate({
    name: name.trim(),
    description:
      description.trim() || null,
  });
};

  const closeCreatePanel = () => {
  setShowCreatePanel(false);
  setName("");
  setDescription("");
  setFormError(null);
  createMutation.reset();
};

  const categories = categoriesQuery.data ?? [];

  const filteredCategories = useMemo(() => {
    let list = [...categories];

    if (globalSearchText.trim()) {
        const search = globalSearchText.toLowerCase();

        list = list.filter(
        (x) =>
            x.name?.toLowerCase().includes(search) ||
            x.description?.toLowerCase().includes(search)
        );
    }

    if (categoryNameFilter.trim()) {
        const search = categoryNameFilter.toLowerCase();

        list = list.filter((x) => x.name?.toLowerCase().includes(search));
    }

    if (descriptionFilter.trim()) {
        const search = descriptionFilter.toLowerCase();

        list = list.filter((x) => x.description?.toLowerCase().includes(search));
    }

    if (selectedCategoryIds.length > 0) {
        list = list.filter((x) =>
            selectedCategoryIds.includes(String(x.id))
        );
    }

    if (statusFilter) {
        list = list.filter((x) =>
        statusFilter === "active" ? x.isActive !== false : x.isActive === false
        );
    }

    list.sort((a, b) => {
        let first = "";
        let second = "";

        if (sortBy === "name") {
        first = a.name ?? "";
        second = b.name ?? "";
        }

        if (sortBy === "createdDate") {
        first = a.createdDate ?? "";
        second = b.createdDate ?? "";
        }

        const result = first.localeCompare(second, "tr");

        return sortDirection === "asc" ? result : -result;
    });

    return list;
    }, [
    categories,
    globalSearchText,
    categoryNameFilter,
    descriptionFilter,
    selectedCategoryIds,
    statusFilter,
    sortBy,
    sortDirection,
    ]);

  const columns: DataTableColumn<Category>[] = [
    {
      header: "Kategori",
      render: (category) => (
        <div>
          <p className="font-semibold text-slate-800">{category.name}</p>
          <p className="text-xs text-slate-400">ID: {category.id}</p>
        </div>
      ),
    //   filter: (
    //     <input
    //         className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
    //         placeholder="Kategori ara..."
    //         value={categoryNameFilter}
    //         onChange={(e) => setCategoryNameFilter(e.target.value)}
    //     />
    // ),
    },
    {
      header: "Açıklama",
      render: (category) => category.description || "-",
    //   filter: (
    //     <input
    //         className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
    //         placeholder="Açıklama ara..."
    //         value={descriptionFilter}
    //         onChange={(e) => setDescriptionFilter(e.target.value)}
    //     />
    // ),
    },
    {
      header: "Durum",
      render: (category) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            category.isActive === false
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {category.isActive === false ? "Pasif" : "Aktif"}
        </span>
      ),
      // filter: (
      //   <select
      //     className="w-full h-10 border border-slate-200 rounded-lg px-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
      //     value={statusFilter}
      //     onChange={(e) => setStatusFilter(e.target.value)}
      //   >
      //     <option value="">Seçiniz</option>
      //     <option value="active">Aktif</option>
      //     <option value="passive">Pasif</option>
      //   </select>
      // ),
    },
    {
      header: "Oluşturma Tarihi",
      render: (category) =>
        category.createdDate
          ? new Date(category.createdDate).toLocaleDateString("tr-TR")
          : "-",
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
        title="Kategoriler"
        moduleName="Ürün & Stok"
        description="Ürün kategorilerini görüntüleyin, düzenleyin ve yönetin."
        rightContent={
          <div className="flex items-center gap-3">
            <button className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50">
              <Download size={18} />
              Dışa Aktar
            </button>

            <button
              onClick={() => {setFormError(null);
  createMutation.reset(); setShowCreatePanel(true)}}
              className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2 hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Kategori Ekle
            </button>
          </div>
        }
      />
      {categoriesQuery.isError && (
  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {getErrorMessage(
      categoriesQuery.error
    )}
  </div>
)}

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="w-[160px]">
      <MultiSelect
        label="Kategori"
        values={selectedCategoryIds}
        onChange={setSelectedCategoryIds}
        placeholder="Kategori"
        options={categories.map((category) => ({
          label: category.name,
          value: String(category.id),
        }))}
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
            label: "Oluşturma Tarihi",
            value: "createdDate",
          },
          {
            label: "Kategori Adı",
            value: "name",
          },
          {
            label: "Açıklama",
            value: "description",
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
            label: "Azalan",
            value: "desc",
          },
          {
            label: "Artan",
            value: "asc",
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
        setSelectedCategoryIds([]);
        setStatusFilter("");
        setSortBy("createdDate");
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
      onClick={() => categoriesQuery.refetch()}
      disabled={categoriesQuery.isFetching}
      title="Kategorileri yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          categoriesQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

<Card
  title={`Toplam ${filteredCategories.length} kategori bulundu`}
>
  <DataTable
    columns={columns}
    data={filteredCategories}
    loading={categoriesQuery.isLoading}
    emptyText="Kategori bulunamadı."
    totalCount={filteredCategories.length}
  />
</Card>

      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[440px] h-full bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Yeni Kategori</h3>
                <p className="text-sm text-slate-500">Kategori bilgilerini girin.</p>
              </div>

              <button
                onClick={closeCreatePanel}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createCategory} className="space-y-4">
              {formError && (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
    {formError}
  </div>
)}

{/* {createMutation.isError && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {getErrorMessage(
      createMutation.error
    )}
  </div>
)} */}
              <TextInput
                label="Kategori Adı"
                value={name}
                onChange={setName}
                placeholder="Örn: Elektronik"
                required
              />

              <TextInput
                label="Açıklama"
                value={description}
                onChange={setDescription}
                placeholder="Opsiyonel açıklama"
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