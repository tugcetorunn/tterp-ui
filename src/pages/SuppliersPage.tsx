import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import { getErrorMessage } from "../utils/apiResponse";
import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";

import { supplierService } from "../services/supplierService";
import type { Supplier } from "../services/supplierService";

export default function SuppliersPage() {
  const queryClient = useQueryClient();

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const suppliersQuery = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierService.getList,
  });

  const createMutation = useMutation({
    mutationFn: supplierService.create,
    onSuccess: async () => {
      setName("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setAddress("");
      setCity("");
      setCountry("");
      setShowCreatePanel(false);

      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const suppliers = suppliersQuery.data ?? [];

  const filteredSuppliers = useMemo(() => {
    let list = [...suppliers];

    if (globalSearchText.trim()) {
      const search = globalSearchText.toLowerCase();

      list = list.filter(
        (x) =>
          x.name?.toLowerCase().includes(search) ||
          x.contactName?.toLowerCase().includes(search) ||
          x.contactEmail?.toLowerCase().includes(search) ||
          x.contactPhone?.toLowerCase().includes(search) ||
          x.city?.toLowerCase().includes(search) ||
          x.country?.toLowerCase().includes(search)
      );
    }

    if (nameFilter.trim()) {
      const search = nameFilter.toLowerCase();
      list = list.filter((x) => x.name?.toLowerCase().includes(search));
    }

    if (cityFilter.trim()) {
      const search = cityFilter.toLowerCase();
      list = list.filter((x) => x.city?.toLowerCase().includes(search));
    }

    if (statusFilter) {
      list = list.filter((x) =>
        statusFilter === "active" ? x.isActive !== false : x.isActive === false
      );
    }

    list.sort((a, b) => {
      let result = 0;

      if (sortBy === "name") result = a.name.localeCompare(b.name, "tr");
      if (sortBy === "city") result = (a.city || "").localeCompare(b.city || "", "tr");
      if (sortBy === "country") {
        result = (a.country || "").localeCompare(b.country || "", "tr");
      }

      return sortDirection === "asc" ? result : -result;
    });

    return list;
  }, [
    suppliers,
    globalSearchText,
    nameFilter,
    cityFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const clearFilters = () => {
    setGlobalSearchText("");
    setNameFilter("");
    setCityFilter("");
    setStatusFilter("");
    setSortBy("name");
    setSortDirection("asc");
  };

  const createSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      contactName: contactName.trim() || null,
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
    });
  };

  const columns: DataTableColumn<Supplier>[] = [
    {
      header: "Tedarikçi",
      render: (supplier) => (
        <div>
          <p className="font-semibold text-slate-800">{supplier.name}</p>
          <p className="text-xs text-slate-400">ID: {supplier.id}</p>
        </div>
      ),
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Tedarikçi ara..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Yetkili",
      render: (supplier) => supplier.contactName || "-",
      filter: null,
    },
    {
      header: "Email",
      render: (supplier) => supplier.contactEmail || "-",
      filter: null,
    },
    {
      header: "Telefon",
      render: (supplier) => supplier.contactPhone || "-",
      filter: null,
    },
    {
      header: "Şehir",
      render: (supplier) => supplier.city || "-",
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Şehir ara..."
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Ülke",
      render: (supplier) => supplier.country || "-",
      filter: null,
    },
    {
      header: "Durum",
      render: (supplier) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            supplier.isActive === false
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {supplier.isActive === false ? "Pasif" : "Aktif"}
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
        title="Tedarikçiler"
        moduleName="Satın Alma"
        description="Tedarikçi kayıtlarını görüntüleyin, ekleyin ve yönetin."
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
              Yeni Tedarikçi Ekle
            </button>
          </div>
        }
      />

      {createMutation.isError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 whitespace-pre-line">
            {getErrorMessage(createMutation.error)}
        </div>
        )}

        {suppliersQuery.isError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 whitespace-pre-line">
            {getErrorMessage(suppliersQuery.error)}
        </div>
      )}

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-4 gap-4">
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
              { label: "Tedarikçi Adı", value: "name" },
              { label: "Şehir", value: "city" },
              { label: "Ülke", value: "country" },
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
                placeholder="Tedarikçi, yetkili, şehir..."
                value={globalSearchText}
                onChange={(e) => setGlobalSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredSuppliers.length} tedarikçi bulundu`}
        headerRight={
          <button
            onClick={() => suppliersQuery.refetch()}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Yenile
          </button>
        }
      >
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={suppliersQuery.isLoading}
          emptyText="Tedarikçi bulunamadı."
          totalCount={filteredSuppliers.length}
        />
      </Card>

      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[520px] h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Yeni Tedarikçi
                </h3>
                <p className="text-sm text-slate-500">Tedarikçi bilgilerini girin.</p>
              </div>

              <button
                onClick={() => setShowCreatePanel(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createSupplier} className="space-y-4">
              <TextInput label="Tedarikçi Adı" value={name} onChange={setName} required />
              <TextInput label="Yetkili Adı" value={contactName} onChange={setContactName} />
              <TextInput label="Yetkili Email" value={contactEmail} onChange={setContactEmail} type="email" />
              <TextInput label="Yetkili Telefon" value={contactPhone} onChange={setContactPhone} />
              <TextInput label="Adres" value={address} onChange={setAddress} />
              <TextInput label="Şehir" value={city} onChange={setCity} />
              <TextInput label="Ülke" value={country} onChange={setCountry} />

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