import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Eye, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";
import MultiSelect from "../components/form/MultiSelect";
import { useParameterOptions } from "../hooks/useParameterOptions";

import { productService } from "../services/productService";
import type { Product } from "../services/productService";
import { categoryService } from "../services/categoryService";

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const currencyParameters = useParameterOptions(
    "Currency",
    1
  );

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [productNameFilter, setProductNameFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productService.getList,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getList,
  });

  const createMutation = useMutation({
    mutationFn: productService.create,
    onSuccess: async () => {
      setName("");
      setCode("");
      setDescription("");
      setCurrency("");
      setPrice("");
      setCostPrice("");
      setTaxRate("");
      setCategoryId("");
      setShowCreatePanel(false);

      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const currencyOptions = useMemo(
    () =>
      currencyParameters.data.map((item) => ({
        label:
          item.shortCode ??
          item.paramValue,
        value: String(item.paramCode),
      })),
    [currencyParameters.data]
  );

  const clearFilters = () => {
    setGlobalSearchText("");
    setProductNameFilter("");
    setCodeFilter("");
    setSelectedCategoryIds([]);
    setStatusFilter("");
    setSortBy("name");
    setSortDirection("asc");
  };

  const createProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !categoryId || !currency) return;

    createMutation.mutate({
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || null,
      currency: Number(currency),
      price: Number(price || 0),
      costPrice: Number(costPrice || 0),
      taxRate: Number(taxRate || 0),
      categoryId: Number(categoryId),
    });
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (globalSearchText.trim()) {
      const search = globalSearchText.toLowerCase();

      list = list.filter(
        (x) =>
          x.name?.toLowerCase().includes(search) ||
          x.code?.toLowerCase().includes(search) ||
          x.description?.toLowerCase().includes(search) ||
          x.categoryName?.toLowerCase().includes(search)
      );
    }

    if (productNameFilter.trim()) {
      const search = productNameFilter.toLowerCase();
      list = list.filter((x) => x.name?.toLowerCase().includes(search));
    }

    if (codeFilter.trim()) {
      const search = codeFilter.toLowerCase();
      list = list.filter((x) => x.code?.toLowerCase().includes(search));
    }

    if (selectedCategoryIds.length > 0) {
      list = list.filter((x) => selectedCategoryIds.includes(String(x.categoryId)));
    }

    if (statusFilter) {
      list = list.filter((x) =>
        statusFilter === "active" ? x.isActive !== false : x.isActive === false
      );
    }

    list.sort((a, b) => {
      let result = 0;

      if (sortBy === "name") result = a.name.localeCompare(b.name, "tr");
      if (sortBy === "code") result = a.code.localeCompare(b.code, "tr");
      if (sortBy === "price") result = a.price - b.price;
      if (sortBy === "stockQuantity") result = a.stockQuantity - b.stockQuantity;

      return sortDirection === "asc" ? result : -result;
    });

    return list;
  }, [
    products,
    globalSearchText,
    productNameFilter,
    codeFilter,
    selectedCategoryIds,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const columns: DataTableColumn<Product>[] = [
    {
      header: "Ürün",
      render: (product) => (
        <div>
          <p className="font-semibold text-slate-800">{product.name}</p>
          <p className="text-xs text-slate-400">ID: {product.id}</p>
        </div>
      ),
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ürün ara..."
          value={productNameFilter}
          onChange={(e) => setProductNameFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Kod",
      render: (product) => product.code,
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Kod ara..."
          value={codeFilter}
          onChange={(e) => setCodeFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Kategori",
      render: (product) => product.categoryName,
      filter: null,
    },
    {
      header: "Fiyat",
      render: (product) =>
        `${product.price.toLocaleString("tr-TR")} ${product.currencyName ?? ""}`,
      filter: null,
    },
    {
      header: "Maliyet",
      render: (product) =>
        `${product.costPrice.toLocaleString("tr-TR")} ${product.currencyName ?? ""}`,
      filter: null,
    },
    {
      header: "Vergi",
      render: (product) => `%${product.taxRate}`,
      filter: null,
    },
    {
      header: "Stok",
      render: (product) => product.stockQuantity,
      filter: null,
    },
    {
      header: "Durum",
      render: (product) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            product.isActive === false
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {product.isActive === false ? "Pasif" : "Aktif"}
        </span>
      ),
      filter: (
        <select
          className="w-full h-10 border border-slate-200 rounded-lg px-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Seçiniz</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
      ),
    },
    {
      header: "İşlemler",
      render: () => (
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100">
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
        title="Ürünler"
        moduleName="Ürün & Stok"
        description="Ürünleri görüntüleyin, düzenleyin ve yönetin."
        rightContent={
          <div className="flex items-center gap-3">
            <button className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50">
              <Download size={18} />
              Dışa Aktar
            </button>

            <button
              onClick={clearFilters}
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
              Yeni Ürün Ekle
            </button>
          </div>
        }
      />

      {currencyParameters.isError && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Para birimleri yüklenemedi.
        </div>
      )}

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-5 gap-4">
          <MultiSelect
            label="Kategori"
            values={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            placeholder="Kategori seçin"
            options={categories.map((category) => ({
              label: category.name,
              value: String(category.id),
            }))}
          />

          <SelectInput
            label="Durum"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tümü"
            options={[
              { label: "Aktif", value: "active" },
              { label: "Pasif", value: "passive" },
            ]}
          />

          <SelectInput
            label="Sırala"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Ürün Adı", value: "name" },
              { label: "Ürün Kodu", value: "code" },
              { label: "Fiyat", value: "price" },
              { label: "Stok", value: "stockQuantity" },
            ]}
          />

          <SelectInput
            label="Sıralama"
            value={sortDirection}
            onChange={setSortDirection}
            options={[
              { label: "Artan", value: "asc" },
              { label: "Azalan", value: "desc" },
            ]}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Arama
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3 text-slate-400" size={18} />
              <input
                className="w-full h-11 border border-slate-200 rounded-xl pl-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ürün adı, kod, açıklama..."
                value={globalSearchText}
                onChange={(e) => setGlobalSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredProducts.length} ürün bulundu`}
        headerRight={
          <button
            onClick={() => productsQuery.refetch()}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Yenile
          </button>
        }
      >
        <DataTable
          columns={columns}
          data={filteredProducts}
          loading={productsQuery.isLoading}
          emptyText="Ürün bulunamadı."
          totalCount={filteredProducts.length}
        />
      </Card>

      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[520px] h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Yeni Ürün</h3>
                <p className="text-sm text-slate-500">Ürün bilgilerini girin.</p>
              </div>

              <button
                onClick={() => setShowCreatePanel(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createProduct} className="space-y-4">
              <TextInput label="Ürün Adı" value={name} onChange={setName} required />
              <TextInput label="Ürün Kodu" value={code} onChange={setCode} required />
              <TextInput label="Açıklama" value={description} onChange={setDescription} />

              <SelectInput
                label="Kategori"
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Kategori seçin"
                options={categories.map((category) => ({
                  label: category.name,
                  value: String(category.id),
                }))}
              />

              <SelectInput
                label="Para Birimi"
                value={currency}
                onChange={setCurrency}
                placeholder={
                  currencyParameters.isLoading
                    ? "Para birimleri yükleniyor..."
                    : "Para birimi seçin"
                }
                options={currencyOptions}
                disabled={currencyParameters.isLoading}
              />

              <TextInput label="Satış Fiyatı" value={price} onChange={setPrice} type="number" />
              <TextInput label="Maliyet Fiyatı" value={costPrice} onChange={setCostPrice} type="number" />
              <TextInput label="Vergi Oranı" value={taxRate} onChange={setTaxRate} type="number" />

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