import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";

import { customerService } from "../services/customerService";
import type { Customer } from "../services/customerService";

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [taxNumberFilter, setTaxNumberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getList,
  });

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: async () => {
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setTaxNumber("");
      setCustomerType("");
      setEmail("");
      setPhoneNumber("");
      setCity("");
      setCountry("");
      setShowCreatePanel(false);

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const customers = customersQuery.data ?? [];

  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (globalSearchText.trim()) {
      const search = globalSearchText.toLowerCase();

      list = list.filter(
        (x) =>
          x.fullName?.toLowerCase().includes(search) ||
          x.companyName?.toLowerCase().includes(search) ||
          x.taxNumber?.toLowerCase().includes(search) ||
          x.email?.toLowerCase().includes(search) ||
          x.phoneNumber?.toLowerCase().includes(search)
      );
    }

    if (nameFilter.trim()) {
      const search = nameFilter.toLowerCase();

      list = list.filter(
        (x) =>
          x.fullName?.toLowerCase().includes(search) ||
          x.companyName?.toLowerCase().includes(search)
      );
    }

    if (taxNumberFilter.trim()) {
      const search = taxNumberFilter.toLowerCase();
      list = list.filter((x) => x.taxNumber?.toLowerCase().includes(search));
    }

    if (statusFilter) {
      list = list.filter((x) =>
        statusFilter === "active" ? x.isActive !== false : x.isActive === false
      );
    }

    list.sort((a, b) => {
      let result = 0;

      if (sortBy === "name") {
        const aName = a.companyName || a.fullName || "";
        const bName = b.companyName || b.fullName || "";
        result = aName.localeCompare(bName, "tr");
      }

      if (sortBy === "taxNumber") result = a.taxNumber.localeCompare(b.taxNumber, "tr");

      return sortDirection === "asc" ? result : -result;
    });

    return list;
  }, [
    customers,
    globalSearchText,
    nameFilter,
    taxNumberFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const clearFilters = () => {
    setGlobalSearchText("");
    setNameFilter("");
    setTaxNumberFilter("");
    setStatusFilter("");
    setSortBy("name");
    setSortDirection("asc");
  };

  const createCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!taxNumber.trim() || !email.trim() || !phoneNumber.trim()) return;

    createMutation.mutate({
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      companyName: companyName.trim() || null,
      taxNumber: taxNumber.trim(),
      customerType: customerType ? Number(customerType) : null,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      city: city.trim() || null,
      country: country.trim() || null,
    });
  };

  const columns: DataTableColumn<Customer>[] = [
    {
      header: "Müşteri",
      render: (customer) => (
        <div>
          <p className="font-semibold text-slate-800">
            {customer.companyName || customer.fullName || "-"}
          </p>
          <p className="text-xs text-slate-400">ID: {customer.id}</p>
        </div>
      ),
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Müşteri ara..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Vergi/TCKN",
      render: (customer) => customer.taxNumber,
      filter: (
        <input
          className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="No ara..."
          value={taxNumberFilter}
          onChange={(e) => setTaxNumberFilter(e.target.value)}
        />
      ),
    },
    {
      header: "Email",
      render: (customer) => customer.email,
      filter: null,
    },
    {
      header: "Telefon",
      render: (customer) => customer.phoneNumber,
      filter: null,
    },
    {
      header: "Şehir",
      render: (customer) => customer.city || "-",
      filter: null,
    },
    {
      header: "Durum",
      render: (customer) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            customer.isActive === false
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {customer.isActive === false ? "Pasif" : "Aktif"}
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
        title="Müşteriler"
        moduleName="Satış"
        description="Müşteri kayıtlarını görüntüleyin, düzenleyin ve yönetin."
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
              Yeni Müşteri Ekle
            </button>
          </div>
        }
      />

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
              { label: "Müşteri Adı", value: "name" },
              { label: "Vergi/TCKN", value: "taxNumber" },
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
                placeholder="Müşteri, email, telefon..."
                value={globalSearchText}
                onChange={(e) => setGlobalSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredCustomers.length} müşteri bulundu`}
        headerRight={
          <button
            onClick={() => customersQuery.refetch()}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Yenile
          </button>
        }
      >
        <DataTable
          columns={columns}
          data={filteredCustomers}
          loading={customersQuery.isLoading}
          emptyText="Müşteri bulunamadı."
          totalCount={filteredCustomers.length}
        />
      </Card>

      {showCreatePanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="w-[520px] h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Yeni Müşteri</h3>
                <p className="text-sm text-slate-500">Müşteri bilgilerini girin.</p>
              </div>

              <button
                onClick={() => setShowCreatePanel(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createCustomer} className="space-y-4">
              <SelectInput
                label="Müşteri Tipi"
                value={customerType}
                onChange={setCustomerType}
                placeholder="Seçiniz"
                options={[
                  { label: "Bireysel", value: "1" },
                  { label: "Kurumsal", value: "2" },
                ]}
              />

              <TextInput label="Ad" value={firstName} onChange={setFirstName} />
              <TextInput label="Soyad" value={lastName} onChange={setLastName} />
              <TextInput label="Firma Adı" value={companyName} onChange={setCompanyName} />
              <TextInput label="Vergi No / TCKN" value={taxNumber} onChange={setTaxNumber} required />
              <TextInput label="Email" value={email} onChange={setEmail} type="email" required />
              <TextInput label="Telefon" value={phoneNumber} onChange={setPhoneNumber} required />
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