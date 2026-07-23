import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Edit, Plus, RefreshCcw, Search, Trash2, X } from "lucide-react";

import LocationSelector from "../components/location/LocationSelector";
import LocationFilter from "../components/location/LocationFilter";

import {
  emptyLocationValue,
  type LocationValue,
} from "../types/location";
import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";
import { getErrorMessage } from "../utils/apiResponse";

import {
  parameterValueService,
  type ParameterValue,
} from "../services/parameterService";

import { customerService } from "../services/customerService";
import type { Customer } from "../services/customerService";

export default function CustomersPage() {
  const queryClient = useQueryClient();

  const [showCreatePanel, setShowCreatePanel] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState<LocationValue>(emptyLocationValue);
  const [addressLine, setAddressLine] = useState("");

  const [globalSearchText, setGlobalSearchText] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [taxNumberFilter, setTaxNumberFilter] = useState("");
  const [nationalIdFilter, setNationalIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [locationFilter, setLocationFilter] = useState<LocationValue>(emptyLocationValue);

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => customerService.getList()
  });

  const parameterValuesQuery = useQuery({
    queryKey: ["parameterValues", 1],
    queryFn: () =>
      parameterValueService.getList({
        isActive: true,
        isDeleted: false,
        languageId: 1,
      }),
  });

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: async () => {
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setTaxNumber("");
      setNationalId("");
      setCustomerType("");
      setEmail("");
      setPhoneNumber("");
      setAddressLine("");
      setLocation(emptyLocationValue);
      setShowCreatePanel(false);

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const customers = customersQuery.data ?? [];

  const parameterValues: ParameterValue[] = parameterValuesQuery.data ?? [];

  const customerTypeOptions = useMemo(
    () =>
      parameterValues
        .filter(
          (value) =>
            value.paramType
              .trim()
              .toLocaleLowerCase("tr-TR") ===
            "customertype"
        )
        .map((value) => ({
          label: value.paramValue,
          value: String(value.paramCode),
        })),
    [parameterValues]
  );

  const customerTypeNameMap = useMemo(
    () =>
      new Map(
        parameterValues
          .filter(
            (value) =>
              value.paramType
                .trim()
                .toLocaleLowerCase("tr-TR") ===
              "customertype"
          )
          .map((value) => [
            String(value.paramCode),
            value.paramValue,
          ])
      ),
    [parameterValues]
  );

  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (globalSearchText.trim()) {
      const search = globalSearchText.toLowerCase();

      list = list.filter(
        (x) =>
          x.fullName?.toLowerCase().includes(search) ||
          x.companyName?.toLowerCase().includes(search) ||
          x.taxNumber?.toLowerCase().includes(search) ||
          x.nationalId?.toLowerCase().includes(search) ||
          x.email?.toLowerCase().includes(search) ||
          x.phoneNumber?.toLowerCase().includes(search) ||
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

    if (nationalIdFilter.trim()) {
      const search = nationalIdFilter.toLowerCase();
      list = list.filter((x) => x.nationalId?.toLowerCase().includes(search));
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

      if (sortBy === "name") {
        const aName = a.companyName || a.fullName || "";
        const bName = b.companyName || b.fullName || "";
        result = aName.localeCompare(bName, "tr");
      }

      if (sortBy === "taxNumber") {
        result = (a.taxNumber ?? "").localeCompare(
          b.taxNumber ?? "",
          "tr"
        );
      }

      if (sortBy === "nationalId") {
        result = (a.nationalId ?? "").localeCompare(
          b.nationalId ?? "",
          "tr"
        );
      }

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
    customers,
    globalSearchText,
    nameFilter,
    taxNumberFilter,
    nationalIdFilter,
    locationFilter,
    statusFilter,
    sortBy,
    sortDirection,
  ]);

  const createCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isIndividual = customerType === "1";
    const isCorporate = customerType === "2";

    if (!customerType) return;
    if (!email.trim() || !phoneNumber.trim()) return;

    if (isIndividual && !nationalId.trim()) return;
    if (isCorporate && !taxNumber.trim()) return;

    createMutation.mutate({
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      companyName: companyName.trim() || null,

      nationalId: isIndividual
        ? nationalId.trim()
        : null,

      taxNumber: isCorporate
        ? taxNumber.trim()
        : null,

      customerType: Number(customerType),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),

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
      // filter: (
      //   <input
      //     className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="Müşteri ara..."
      //     value={nameFilter}
      //     onChange={(e) => setNameFilter(e.target.value)}
      //   />
      // ),
    },
    {
      header: "Vergi No",
      render: (customer) => customer.taxNumber,
      // filter: (
      //   <input
      //     className="w-full h-10 border border-slate-200 rounded-lg px-3 outline-none focus:ring-2 focus:ring-indigo-500"
      //     placeholder="No ara..."
      //     value={taxNumberFilter}
      //     onChange={(e) => setTaxNumberFilter(e.target.value)}
      //   />
      // ),
    },
    {
      header: "TCKN",
      render: (customer) => customer.nationalId,
    },
    {
      header: "Müşteri Tipi",
      render: (customer) =>
        customer.customerType != null
          ? customerTypeNameMap.get(
            String(customer.customerType)
          ) ?? "-"
          : "-",
      filter: null,
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
      render: (customer) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${customer.isActive === false
            ? "bg-red-50 text-red-600"
            : "bg-green-50 text-green-600"
            }`}
        >
          {customer.isActive === false ? "Pasif" : "Aktif"}
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
              onClick={() => setShowCreatePanel(true)}
              className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2 hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Müşteri Ekle
            </button>
          </div>
        }
      />

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
                  label: "Müşteri Adı",
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
                placeholder="Müşteri, lokasyon..."
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
            onClick={() => customersQuery.refetch()}
            disabled={customersQuery.isFetching}
            title="Müşterileri yenile"
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={
                customersQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Yenile
          </button>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredCustomers.length} müşteri bulundu`}
      >
        <DataTable
          columns={columns}
          data={filteredCustomers}
          loading={
            customersQuery.isLoading ||
            parameterValuesQuery.isLoading
          }
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
                options={customerTypeOptions}
              />

              <TextInput label="Ad" value={firstName} onChange={setFirstName} />
              <TextInput label="Soyad" value={lastName} onChange={setLastName} />
              <TextInput label="Firma Adı" value={companyName} onChange={setCompanyName} />
              {/* <TextInput label="Vergi No" value={taxNumber} onChange={setTaxNumber} required />
              <TextInput label="TCKN" value={nationalId} onChange={setNationalId} required /> */}
              {customerType === "1" && (
                <TextInput
                  label="T.C. Kimlik No"
                  value={nationalId}
                  onChange={setNationalId}
                  required
                />
              )}

              {customerType === "2" && (
                <TextInput
                  label="Vergi No"
                  value={taxNumber}
                  onChange={setTaxNumber}
                  required
                />
              )}
              <TextInput label="Email" value={email} onChange={setEmail} type="email" required />
              <TextInput label="Telefon" value={phoneNumber} onChange={setPhoneNumber} required />
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

              {createMutation.isError && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {getErrorMessage(createMutation.error)}
                </div>
              )}

              <button
                type="submit"
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