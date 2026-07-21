import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import LocationSelector from "../components/location/LocationSelector";
import LocationFilter from "../components/location/LocationFilter";

import {
  emptyLocationValue,
  type LocationValue,
} from "../types/location";
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
  const [location, setLocation] = useState<LocationValue>(emptyLocationValue);
  const [addressLine, setAddressLine] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [locationFilter, setLocationFilter] = useState<LocationValue>(emptyLocationValue);

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
      setAddressLine("");
      setLocation(emptyLocationValue);
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
          x.countryName?.toLocaleLowerCase("tr-TR").includes(search) ||
          x.cityName?.toLocaleLowerCase("tr-TR").includes(search) ||
          x.townName?.toLocaleLowerCase("tr-TR").includes(search) ||
          x.districtName?.toLocaleLowerCase("tr-TR").includes(search) ||
          x.neighborhoodName?.toLocaleLowerCase("tr-TR").includes(search) ||
          x.addressLine?.toLocaleLowerCase("tr-TR").includes(search)
      );
    }

    if (nameFilter.trim()) {
      const search = nameFilter.toLowerCase();
      list = list.filter((x) => x.name?.toLowerCase().includes(search));
    }

    if (locationFilter.countryId) {
      list = list.filter(
        (x) =>
          String(x.countryId) === locationFilter.countryId
      );
    }

    if (locationFilter.cityId) {
      list = list.filter(
        (x) =>
          String(x.cityId) === locationFilter.cityId
      );
    }

    if (locationFilter.townId) {
      list = list.filter(
        (x) =>
          String(x.townId) === locationFilter.townId
      );
    }

    if (locationFilter.districtId) {
      list = list.filter(
        (x) =>
          String(x.districtId) === locationFilter.districtId
      );
    }

    if (locationFilter.neighborhoodId) {
      list = list.filter(
        (x) =>
          String(x.neighborhoodId) ===
          locationFilter.neighborhoodId
      );
    }

    if (statusFilter) {
      list = list.filter((x) =>
        statusFilter === "active" ? x.isActive !== false : x.isActive === false
      );
    }

    list.sort((a, b) => {
      let result = 0;

      if (sortBy === "name") result = a.name.localeCompare(b.name, "tr");
      
      if (sortBy === "country") {
        result = (a.countryName ?? "").localeCompare(
          b.countryName ?? "",
          "tr"
        );
      }

      if (sortBy === "city") {
        result = (a.cityName ?? "").localeCompare(
          b.cityName ?? "",
          "tr"
        );
      }

      if (sortBy === "town") {
        result = (a.townName ?? "").localeCompare(
          b.townName ?? "",
          "tr"
        );
      }

      if (sortBy === "district") {
        result = (a.districtName ?? "").localeCompare(
          b.districtName ?? "",
          "tr"
        );
      }

      if (sortBy === "neighborhood") {
        result = (a.neighborhoodName ?? "").localeCompare(
          b.neighborhoodName ?? "",
          "tr"
        );
      }

      return sortDirection === "asc" ? result : -result;
    });

    return list;
  }, [
    suppliers,
    globalSearchText,
    nameFilter,
    locationFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const clearFilters = () => {
    setGlobalSearchText("");
    setNameFilter("");
    setLocationFilter(emptyLocationValue);
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
      countryId: location.countryId
        ? Number(location.countryId)
        : null,

      cityId: location.cityId
        ? Number(location.cityId)
        : null,

      townId: location.townId
        ? Number(location.townId)
        : null,

      districtId: location.districtId
        ? Number(location.districtId)
        : null,

      neighborhoodId: location.neighborhoodId
        ? Number(location.neighborhoodId)
        : null,

      addressLine: addressLine.trim() || null,
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
      // filter: (
      //   <input
      //     className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Tedarikçi ara..."
      //     value={nameFilter}
      //     onChange={(e) => setNameFilter(e.target.value)}
      //   />
      // ),
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
      header: "Lokasyon",
      render: (customer) => (
        <div>
          <p className="font-medium text-slate-700">
            {[
              customer.neighborhoodName,
              customer.districtName,
              customer.townName,
              customer.cityName,
            ]
              .filter(Boolean)
              .join(" / ") || "-"}
          </p>

          {customer.countryName && (
            <p className="text-xs text-slate-400">
              {customer.countryName}
            </p>
          )}
        </div>
      ),
      filter: null,
    },
    {
      header: "Adres",
      render: (customer) => (
        <div className="max-w-[260px]">
          <p
            className="text-sm text-slate-600 truncate"
            title={customer.addressLine || ""}
          >
            {customer.addressLine || "-"}
          </p>
        </div>
      ),
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

      <Card className="mb-5 p-4">
  <div className="flex flex-wrap items-end gap-3">
    <div className="min-w-[520px] flex-1">
      <LocationFilter
        value={locationFilter}
        onChange={setLocationFilter}
        showCountry={false}
      />
    </div>

    <div className="w-[125px]">
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

    <div className="w-[150px]">
      <SelectInput
        label="Sırala"
        value={sortBy}
        onChange={setSortBy}
        options={[
          {
            label: "Tedarikçi Adı",
            value: "name",
          },
          {
            label: "Ülke",
            value: "country",
          },
          {
            label: "Şehir",
            value: "city",
          },
          {
            label: "İlçe",
            value: "town",
          },
          {
            label: "Semt / Bölge",
            value: "district",
          },
          {
            label: "Mahalle",
            value: "neighborhood",
          },
        ]}
      />
    </div>

    <div className="w-[115px]">
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

    <div className="w-[160px]">
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
          placeholder="Tedarikçi, yetkili..."
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
        setStatusFilter("");
        setSortBy("name");
        setSortDirection("asc");
        setGlobalSearchText("");

        setLocationFilter({
          countryId: "",
          cityId: "",
          townId: "",
          districtId: "",
          neighborhoodId: "",
        });
      }}
      title="Filtreleri temizle"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <X size={16} />
      Temizle
    </button>

    <button
      type="button"
      onClick={() => suppliersQuery.refetch()}
      disabled={suppliersQuery.isFetching}
      title="Tedarikçileri yenile"
      className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCcw
        size={16}
        className={
          suppliersQuery.isFetching
            ? "animate-spin"
            : ""
        }
      />
      Yenile
    </button>
  </div>
</Card>

      <Card
  title={`Toplam ${filteredSuppliers.length} tedarikçi bulundu`}
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
              <LocationSelector
                value={location}
                onChange={setLocation}
                showCountry={false}
              />
              
                            <TextInput
                              label="Açık Adres"
                              value={addressLine}
                              onChange={setAddressLine}
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